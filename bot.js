const restify = require('restify');
const builder = require('botbuilder');
const axios = require('axios');
const assert = require('assert');
const body_parser = require('body-parser');

// Запуск сервера restify
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_URL = process.env.DB_URL;
const DB_PROJECT = process.env.DB_PROJECT;
console.log(`==================================`);
console.log(`DB_USER: ${DB_USER}`);
console.log(`DB_PASS: ${DB_PASS}`);
console.log(`DB_URL: ${DB_URL}`);
console.log(`DB_PROJECT: ${DB_PROJECT}`);
console.log(`==================================`);

server.use(restify.plugins.queryParser());
server.use(body_parser.text());

// Подключение к MongoDB
const MongoClient = require('mongodb').MongoClient;
const mongoURI = `mongodb://${DB_USER}:${DB_PASS}@${DB_URL}/${DB_PROJECT}`
const mongoClient = new MongoClient(mongoURI, {useNewUrlParser: true});
const mongoDB = () => mongoClient.db(DB_PROJECT);

// Глобальные переменные для справочника ID каналов и подписок
let channelIds = [];
let subs = [];
let addresses = [];

// Подключение клиента к базе данных и заполнение глобальных переменных
mongoClient.connect()
    .then(() => mongoDB().collection("subs").find().toArray())
    .then(subsCollection => this.subs = subsCollection)
    .then(() => mongoDB().collection("channelIds").find().toArray())
    .then(channelIdsCollection => this.channelIds = channelIdsCollection)
    .catch(err => console.log(err));

const BOT_NAME = process.env.BOT_NAME;
const BOT_ID = process.env.BOT_ID;
const BOT_PASS = process.env.BOT_PASS;
const BOT_META = process.env.BOT_META;
console.log(`===============================`)
console.log(`BOT_NAME ${BOT_NAME}`)
console.log(`BOT_ID ${BOT_ID}`)
console.log(`BOT_PASS ${BOT_PASS}`)
console.log(`BOT_META ${BOT_META}`)
console.log(`===============================`)

// Create chat connector for communicating with the Bot Framework Service
//
const connector = new builder.ChatConnector({
    appId: this.BOT_ID,
    appPassword: this.BOT_PASS,
    openIdMetadata: this.BOT_META
});

const bot = new builder.UniversalBot(connector);
bot.use(builder.Middleware.dialogVersion({
    version: 1.0,
    resetCommand: /^reset/i
}));

// Регистрация хранилища в памяти
const inMemoryStorage = new builder.MemoryBotStorage();
bot.set('storage', inMemoryStorage);

// Прослушивание сообщений от пользователей
server.post('/api/messages', () => connector.listen());

// // Прослушивание запросов от GitLab
// server.post('/api/projects/:project/actions/:action/notifications', (req, res, next) => {
//     var project = req.params.project;
//     var action = req.params.action;
//     var notification = req.body;
//
//     subs.forEach((sub) => {
//         if (sub.project == project && sub.action == action) {
//             addresses.forEach((element) => {
//                 if (sub.channelId == element.channelId) {
//                     var msg = new builder.Message().address(element);
//                     msg.text(notification);
//                     bot.send(msg)
//                 }
//             })
//         }
//     })
//
//     res.send("request accepted");
//     next();
// });

// На нераспознанные сообщения бот молчит
//
// Если не прописывать этот диалог, то бот будет крашиться на любом сообщении, не соответствующем прописанным условиям
// в иных диалогах
// bot.dialog('/', [
//     (session) => session.endDialog()
// ]);

// Приветствие
//
// bot.dialog('start', [
//     (session) => session.send("Бот на связи и готов к работе. Отправьте '@SkypeLab help', чтобы вызвать справку по командам.")
// ]);

// Справка о командах
//
// Все пробелы и табуляции, поставленные в редакторе, сохраняются и в сообщении!
// bot.dialog('help', [
//     (session) => session.send(`Список доступных команд:\n
//     - setup - запись идентификатора беседы в базу данных;\n
//     - subscribe - создать новую подписку на событие;\n
//     - subs - посмотреть подписки для этого чата;\n
//     - unsubscribe - удалить подписку.\n
//     Помните, что для вызова команды нужно меня упомянуть: @SkypeLab`)
// ]);

// // Запись идентификатора в БД
// //
// bot.dialog('setup', [(session) => {
//     // Запись адреса
//     if (!addresses.includes(session.message.address)) {
//         addresses.push(session.message.address);
//     }
//
//     // Канал уже зарегистрирован
//     const currChannelId = session.message.address.channelId;
//
//     if (channelIds.filter((element) => {
//         element.channelId == currChannelId
//     })) {
//         session.send(`Ваш идентификатор канала уже зарегистрирован.`);
//     } else {
//         const channelIdsCollection = this.mongoDB().collection("channelIds");
//         channelIdsCollection.insertOne({channelId: currChannelId}).then(() => {
//             // Обновление списка идентификаторов
//             return channelIdsCollection.find().toArray();
//         }).then((updatedCollection) => {
//             channelIds = updatedCollection;
//             session.send(`Ваш идентификатор канала ${session.message.address.channelId} сохранён.`);
//         }).catch(err => {
//             console.log(err);
//         });
//     }
// }])
//     .triggerAction({
//         matches: /^@SkypeLab setup/,
//         onSelectAction: (session, args, next) => {
//             session.beginDialog(args.action, args);
//         }
//     });
//
// // Список подписок
// //
// bot.dialog('subs', [(session) => {
//     if (subs.length > 0) {
//         var currChannelId = session.message.address.channelId;
//
//         if (subs.filter((element) => {
//             element.channelId == currChannelId
//         })) {
//             let subsString = `Список подписок для данного канала: \n`;
//             subs.forEach((element) => {
//                 // Отсеивание подписок, не относящихся к каналу
//                 if (currChannelId == element.channelId) {
//                     subsString += `- ${element.subName}\n`;
//                 }
//             });
//
//             session.send(subsString);
//         }
//         // Подписки для текущего канала не найдены
//         else {
//             session.send(`Подписок не найдено.`);
//         }
//     }
//     // Подписок нет вообще
//     else {
//         session.send(`Список подписок пуст.`);
//     }
// }])
//     .triggerAction({
//         matches: /^@SkypeLab subs/,
//         onSelectAction: (session, args, next) => {
//             session.beginDialog(args.action, args);
//         }
//     });
//
// // Подписаться
// //
// // Prompts всегда принимает два аргумента: сессию и текст запроса
// bot.dialog('subscribe', [function (session) {
//     builder.Prompts.text(session, "Введите название проекта в формате 'группа/проект'.");
// },
//     function (session, results) {
//         session.dialogData.project = results.response;
//         builder.Prompts.text(session, "Введите название события.");
//     },
//     function (session, results) {
//         var subName = `${session.dialogData.project}_${results.response}`;
//         var currChannelId = session.message.address.channelId;
//
//         // Подписка с таким ID для канала существует
//         if (subs.filter((element) => {
//             element.channelId == currChannelId && element.subName == subName
//         })) {
//             session.send(`Подписка ${subname} уже существует.`);
//         } else {
//             const subsCollection = this.mongoDB().collection("subs");
//             subsCollection.insertOne({
//                 channelId: currChannelId,
//                 subName: subName,
//                 project: session.dialogData.project,
//                 action: results.response
//             })
//                 .then(() => {
//                     return subsCollection.find().toArray();
//                 })
//                 .then((updatedCollection) => {
//                     subs = updatedCollection;
//                     session.send(`Новая подписка ${subName} сохранена. Используйте команду "@SkypeLab subs", чтобы увидеть все подписки.`);
//                 })
//                 .catch(err => {
//                     console.log(err);
//                 });
//         }
//     }])
//     .endConversationAction("endSub", "Отмена", {
//         matches: new RegExp(`/@SkypeLab cancel/`),
//         confirmPrompt: "Уверены, что хотите прервать процесс?"
//     })
//     .triggerAction({
//         matches: /^@SkypeLab subscribe/,
//         onSelectAction: (session, args, next) => {
//             session.beginDialog(args.action, args);
//         }
//     });
//
// // Отписаться
// //
// bot.dialog('unsubscribe', [function (session) {
//     builder.Prompts.text(session, "Введите идентификатор подписки для удаления");
// },
//     function (session, results) {
//         var subName = results.response;
//         var currChannelId = session.message.address.channelId;
//
//         if (subs.filter((element) => {
//             element.channelId == currChannelId && element.subName == subName
//         })) {
//             const subsCollection = this.mongoDB().collection("subs");
//             subsCollection.deleteOne({channelId: currChannelId, subName: subName})
//                 .then(() => {
//                     return subsCollection.find().toArray();
//                 })
//                 .then((updatedCollection) => {
//                     subs = updatedCollection;
//                     session.send(`Подписка ${subName} удалена. Используйте команду "@SkypeLab subs", чтобы увидеть все подписки.`);
//                 })
//                 .catch(err => {
//                     console.log(err);
//                 });
//         } else {
//             session.send("Подписка не найдена. Используйте команду \"@SkypeLab subs\", чтобы увидеть все подписки.");
//         }
//     }])
//     .endConversationAction("endUnsub", "Отмена", {
//         matches: new RegExp(`/@SkypeLab cancel/`),
//         confirmPrompt: "Уверены, что хотите прервать процесс?"
//     })
//     .triggerAction({
//         matches: /^@SkypeLab unsubscribe/,
//         onSelectAction: (session, args, next) => {
//             session.beginDialog(args.action, args);
//         }
//     });