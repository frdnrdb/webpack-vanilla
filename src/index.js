import './scss/index.scss';
import { qs, create, state } from 'ljsy';

const root = qs('#root');

const div = create('div', root, {
    innerHTML: '<b></b>',
    children: [
        {
            type: 'button',
            innerHTML: 'click',
            on: {
                click: bgColor
            }        
        }
    ]
});

function bgColor() {
    const col = randomColor();
    document.body.style.background = col;
    document.documentElement.style.setProperty('--color-bg', col);
}

function randomColor() {
    return Array(6).fill().reduce(c => c + '0123456789ABCDEF'[Math.floor(Math.random() * 16)], '#');
}

const object = { propertyName: 'thing' };

state.attach('test', 'test fest', [
    [ create('input', div), 'value', 'keyup' ],
    [ div.children[0], 'innerHTML' ],
    [ object, 'propertyName' ]
], (eventType, value, e) => {
    console.log('input', value);
    console.log('object', object)
    console.log('attribute', div.children[1].getAttribute('test'));
    console.log('html', div.children[0].innerHTML);
    console.log('get', state.get('test'));
    console.log('---');
});

state.attach('test', div.children[1], 'attribute.test');