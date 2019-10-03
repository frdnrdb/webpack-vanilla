import './scss/index.scss';
import { qs, create, state } from 'ljsy';

const root = qs('#root');

const div = create('div', root, {
    innerHTML: 'test fest',
    style: {
        border: '10px solid gold'
    },
    children: [
        {
            type: 'button',
            innerHTML: 'italic',
            on: {
                click: e => {
                    e.target.parentElement.style.border = '10px solid ' + getRandomColor();
                }
            }        
        }
    ]
});

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    return Array(6).fill().reduce(c => c + letters[Math.floor(Math.random() * 16)], '#');
}

const object = { propertyName: 'thing' };

state.attach('test', 'init', [
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
