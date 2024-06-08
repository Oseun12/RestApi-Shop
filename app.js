const path = require('path');
//const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');
//const {Server} = require('socket.io');
//const socketIO = require('socket.io');
//const socket = require('./socket');
//const http = require('http');
//const Server = require('socket.io');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

const app = express();
//const server = http.createServer(app);

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);
app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not Authenticated!');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }
  // To clear the old image
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
  .status(201)
  .json({ message: 'File stored.', filePath: req.file.path.replace("\\", "/") })
});


app.use(
  '/graphql', 
  graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatError(err) {
    if (!err.originalError) {
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'An error occurred';
    const code = err.originalError.code || 500;
    return { message: message, status: code, data: data }
  }
})
);
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// app.get('/socket', (req, res, next) => {
//     res.sendFile(join(__dirname, 'index.html'));
// })

mongoose
  .connect(
    'mongodb+srv://marrizzsalau7:001479@cluster0.kepxlcb.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0',
  )
  .then(result => {
    app.listen(8080);
    // const io = require('./socket').init(server);
    // io.on('connection', socket => {
    //   console.log('Client Connected!');
    // });
  })
  .catch(err => console.log(err));
// To clear the recently uploaded image
  // const clearImage = filePath => {
  //   filePath = path.join(__dirname, '..', filePath);
  //   fs.unlink(filePath, err => console.log(err));
  // };
  
    
// mongoose
//   .connect(
//     'mongodb+srv://marrizzsalau7:001479@cluster0.kepxlcb.mongodb.net/messages?retryWrites=true&w=majority&appName=Cluster0'
//   )
//   .then(result => {
//     const server = app.listen(8080);
//     const io = require('./socket').init(server);
//     io.on('connection', socket => {
//       console.log('Client Connected!');
//     });
//   })
//   .catch(err => console.log(err));


// //console.log('MongoDB connected');
//     //const io = new socketIO.Server(server);
//     const io = new Server(server);
//     io.on('connection', (socket) => {
//       console.log('Client connected!');
//       socket.on('disconnect', () => {
//         console.log('Client disconnected');
//       });
//     });
//     const PORT = process.env.PORT || 8080; 
//     server.listen(8080, () => {
//       //console.log('Server is running on port 8080');