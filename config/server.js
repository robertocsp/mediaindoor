const port = 3030;

const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const redis = require('socket.io-redis');
const fileUpload = require('express-fileupload');
const authorize = require('../_helpers/authorize')
const errorHandler = require('../_helpers/error-handler');
const placeService = require('../places/place.service');
const adService = require('../advertisements/ad.service');
const compression = require('compression');
const helmet = require('helmet');
const ObjectId = require('mongodb').ObjectID;

io.adapter(redis({ host: 'redis', port: 6379 }));

//Este middleware diz para o server, se os dados foram passados por um formulario.
app.use(bodyParser.urlencoded({ extended: true }))

//Verificar se dentro da requisicao o corpo do conteudo é um JSON
app.use(bodyParser.json())

app.use(helmet());
app.use(compression());

app.use(express.static(__dirname + '/../staticfiles'));

app.use(authorize.isLogged().unless({ path: [/\/api\/v1\/users\/authenticate\/?/] }));

// global error handler
app.use(errorHandler);

app.use(fileUpload({
	createParentPath: true,
	limits: { fileSize: 1024 * 1024 }, // 1mb
	safeFileNames: true,
	abortOnLimit: true,
	preserveExtension: true
}));

server.listen(port, () => {
	console.log(`backend is running on port ${port}.`)
});

module.exports = app;

io.on('connection', (socket) => {
	console.log('CLIENT CONNECTED ::: ' + socket.id);
	socket.on('joinPlace', async (placekey) => {
		console.log('JOINPLACE ::: ' + placekey);
		placeService.getBy({ placekey: placekey })
			.then(place => {
				if (place.length) {
					place = place[0];
					console.log('SOCKET JOIN ::: ' + place._id);
					socket.join(place._id);
					ads = adService.getBy({
						$or: [{ groups: ObjectId(place.group) },
						{ places: ObjectId(place._id) }]
					})
						.then(ads => {
							console.log('ADS JOINPLACE');
							socket.emit('ads-message', JSON.stringify(ads));
						})
						.catch(err => console.error(err));
				}
			})
			.catch(err => console.error(err));

	});
});