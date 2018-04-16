const http = require('http');

const Discord = require('discord.js');
const bot = new Discord.Client();
const key = require('../key.js');


var state, alertItem = {};

var options = {
    host: 'content.warframe.com',
    path: '/dynamic/worldState.php'
}

var factionList = {
    'FC_GRINEER' :      'Гренки     ',
    'FC_INFESTATION' :  'Заражёнка  ',
    'FC_CORPUS' :       'Корпусня   ',
    'FC_OROKIN' :       'Орокин     '
}

var missionTypeList = {
    'MT_SURVIVAL' :         'Выживалово         ',
    'MT_MOBILE_DEFENSE' :   'Мобильная попорона ',
    'MT_CAPTURE' :          'Захват             ',
    'MT_EXTERMINATION' :    'Зачистка           ',
    'MT_TERRITORY' :        'Перехват           ',
    'MT_INTEL' :            'Шпионаж            ',
    'MT_RESCUE' :           'Спасение           ',
}

function alerts() {
    var request = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            state = JSON.parse(data);
            console.log('Complite fetching.');
            setTimeout(alerts, 30000);
            parse();
        });
    });
    request.on('error', function (e) {
        console.log(e.message);
    });

    request.end();
    console.log('Fetching data from warframe.com...');
}

function faction(f) {
    if ( factionList[f] ) {
        return factionList[f];
    } else {
        return f;
    }
}

function mission(m) {
    if ( missionTypeList[m] ) {
        return missionTypeList[m];
    } else {
        return m;
    }
}

function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var sec = s % 60;
    s = (s - sec) / 60;
    var min = s % 60;
    var hr = (s - min) / 60;

    if (hr != 0) {
        return hr + 'ч ' + min + 'м ' + sec +'с';
    } else {
        return min + 'м ' + sec +'с';
    }
    
}

function parse() {
    var serverTime = new Date();
    alertItem = [];
    for (i = 0; i < state['Alerts'].length; i++) {
        /*alertItem.push('alert_' + i);
        alertItem[i].push(['expire'] = state['Alerts'][i]['Expiry']['$date']['$numberLong']);
        alertItem[i].push(['missionType'] = mission(state['Alerts'][i]['MissionInfo']['missionType']));
        alertItem[i].push(['enemy'] = faction(state['Alerts'][i]['MissionInfo']['faction']));
        alertItem[i].push(['lvl'] = state['Alerts'][i]['MissionInfo']['minEnemyLevel'] + '-' + state['Alerts'][i]['MissionInfo']['maxEnemyLevel']);*/

        
        var expire = state['Alerts'][i]['Expiry']['$date']['$numberLong'] - serverTime,
            missionType = mission(state['Alerts'][i]['MissionInfo']['missionType']),
            enemy = faction(state['Alerts'][i]['MissionInfo']['faction']);
            lvl = state['Alerts'][i]['MissionInfo']['minEnemyLevel'] + '-' + state['Alerts'][i]['MissionInfo']['maxEnemyLevel'];
        alertItem.push(missionType + ' ' + enemy + ' ' + lvl + ' осталось: ' + msToTime(expire));
    }
}


bot.on('message', (message) => {
    if (message.content == '-h') {
        message.reply('```Дороу!\nЯ - ВафлБот.\nИ вот что ты можешь попросить меня сделать, дорогой друг.\nТы можешь набрать:\n-l       : и я покажу, чо щас в алертах\n\n\nmore commands in development...\nmaybe...```');
    } else if (message.content == 'meh') {
        message.reply('слышь, жуёба, хватит лениться!');
    } else if (message.content == '-l') {
        let content;
        /*for (let i = 0; i<alertItem.length; i++) {
            
        }*/
        
        alertItem.forEach(function(item){
            content += '```' + (item) + '```';
        });
        message.reply(content);
    }
});

bot.login(key.data.bot_id());

alerts();