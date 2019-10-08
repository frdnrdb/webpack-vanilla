const fs = require('fs');
const s3 = require('s3');
const fetch = require('node-fetch');
const pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json'));

const style = {
    cyanF: '\x1b[35m',
    cyanB: '\x1b[45m',
    blackF: '\x1b[30m',
    reset: '\x1b[0m'
};

const s3Folder = () => pkg.name || new Date().toLocaleString().replace(/[/,\s:]/g, '-'); // 02-10-2019--13-51-47
const s3DeployedUrl = () => s3.getPublicUrlHttp(process.env.S3_BUCKET, s3Folder()).replace('http', 'https');

const deployS3 = () => new Promise(resolve => {

    const client = s3.createClient({
        s3Options: {
            accessKeyId: process.env.S3_KEY,
            secretAccessKey: process.env.S3_SECRET,
            region: 'eu-west-1'
        }
    });

    const uploader = client.uploadDir({
        localDir: __dirname + '/dist/',
        deleteRemoved: true,
        s3Params: {
            Bucket: process.env.S3_BUCKET,
            ACL: 'public-read',
            Prefix: s3Folder() + '/'
        },
        getS3Params: (localFile, _, callback) => {
            callback(false, !/DS_Store/.test(localFile));
        }
    });

    uploader.on('error', console.log.bind(this, 'error'));
    uploader.on('progress', () => process.stdout.write('.'));
    uploader.on('end', () => {
        console.log(`\n\n${style.cyanF}deployed ${style.cyanB + style.blackF} ${pkg.name} ${style.reset} ${style.cyanF}on AWS S3:${style.reset}`);
        console.log(s3DeployedUrl() + '/index.html' + '\n');
        resolve();
    });
});

const stripMarkup = html => {

    const dependencies = [];

    // remove script and link tags from markup
    // transform script and link sources to deployed resource
    const stripped = html.replace(/<\s?(link|script)(?!.*icon)[^>]+>(([^<]+)?<\/(link|script)>)?/g, m => {
        dependencies.push(
            m.replace(/((?:src|href)="?)(?!https?:\/\/)((?:[.\/]+)?([^">]+))/g, (_, attr, __, file)=>{
                return attr + s3DeployedUrl() + '/' + file;
            })
        );
        return '';
    });
    
    // keep markup inside body tag and add dependencies with deployed paths
    return `${stripped.replace(/.*<body>(.*)<\/body>.*/, '$1').trim()}\n${dependencies.join('\n')}`;

};
const deployMM = () => new Promise(resolve => {
    const publication = 'fvn';
    const html = fs.readFileSync('./dist/index.html', 'utf8');
    const integrationMarkup = stripMarkup(html);
    let integrationId = pkg['mm-integration-id'];
    
    (function deploy() {
        fetch(`${process.env.MM_API}/${publication}${integrationId ? `?integrationId=${integrationId}` : ''}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    author: pkg.author,
                    title: pkg.name,
                    body: `<!-- ${new Date().toLocaleString()} -->\n${integrationMarkup}`
                })
            })
            .then(res => res.json())
            .then(json => {

                const diff = json.id && integrationId && (integrationId || json.id);
                if (diff) integrationId = false;

                if (!json.id || (json.update && json.update.deleted)) {
                    integrationId = false;
                    return deploy();
                }

                if (json.id && !integrationId) {
                    pkg['mm-integration-id'] = json.id;
                    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2), 'utf8');
                }

                const id = json.id || integrationId;

                console.log(`${style.cyanB + style.blackF} mm.schibsted.tech ${style.reset}${style.cyanF} integration code ${!integrationId ? 'created' : 'updated'}${style.reset}`);
                console.log(`${style.cyanF}integrate${style.reset} https://api.schibsted.tech/proxy/content/v3/publication/fvn/multimedias/${id}/${pkg.name}`);
                console.log(`${style.cyanF}edit${style.reset} https://mm.schibsted.tech/dbs/fvn_multimedia/data/${id}\n`)
                resolve();
            });
    })();
});

function deploy() {
    console.log(`\x1Bc\n\x1b[33mDeploying ${pkg.name}\x1b[0m`);
    const [ , , flag ] = process.argv;
    deployS3().then(() => flag === '--mm' ? deployMM() : process.exit());
}

const defaultPackageName = __dirname.split('/').pop();

if (pkg.name === 'everyday-vanilla') {
    process.stdout.write(`\x1Bc\x1b[33mChange package name\x1b[0m [${defaultPackageName}]: `);
    process.openStdin().addListener('data', buffer => {
        const input = buffer.toString();
        pkg.name = input.charCodeAt(0) === 10 ? defaultPackageName : input.trim();
        if (pkg.name.length < 3) {
            console.log('\n\x1b[31m--- NAME TOO SHORT ---\x1b[0m\n');
            process.exit(1);
        }
        fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2), 'utf8');
        deploy();
    });    
}
else deploy();