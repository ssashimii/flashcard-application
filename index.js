const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const app = express();
const port = 3000;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your-secret-key', 
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.userId);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));


module.exports = passport;

mongoose.connect('mongodb+srv://sashazu:NtAuKMOxWzagRBOH@cluster0.fiabaez.mongodb.net/flashcards?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDb connected'))
  .catch(err => console.log(err));

const UserState = mongoose.model('UserState', {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  currentContainer: String 
});
  

const Collection = mongoose.model('Collections', {
  name: String,
  username: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, 
  isRecommended: Boolean,
  flashcard: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flashcards' }]
});

const Flashcard = mongoose.model('Flashcards', {
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collections' },
  question: String,
  answer: String
});



const User = mongoose.model('Users', {
  username: String,
  password: String,
});

const Score = mongoose.model('Score', {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collections' },
  score: Number,
});


app.use(passport.initialize()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: ['https://ssashimii.github.io'],
  credentials: true
}));; 

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

const { updateAuthButtons } = require('./modules.js');

app.get('/', updateAuthButtons, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/users/state', async (req, res) => {
  const userId = req.user.userId;
  try {
    const userState = await UserState.findOne({ userId });
    if (userState) {
      res.status(200).json({ currentContainer: userState.currentContainer });
    } else {
      res.status(404).json({ message: 'User state not found' });
    }
  } catch (error) {
    console.error('Error fetching user state:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/users/state', async (req, res) => {
  const userId = req.user.userId; 
  const { currentCollectionId } = req.body; 

  try {
    let userState = await UserState.findOne({ userId });
    if (!userState) {
      userState = new UserState({ userId, currentCollectionId });
    } else {
      userState.currentCollectionId = currentCollectionId;
    }
    await userState.save();
    res.status(200).json({ message: 'User state updated successfully' });
  } catch (error) {
    console.error('Error updating user state:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



app.get('/users/state/:userId', async (req, res) => {
  const userId = req.params.userId; 
  try {
    const userState = await UserState.findOne({ userId });
    if (userState) {
      res.status(200).json(userState); 
    } else {
      res.status(404).json({ message: 'User state not found' });
    }
  } catch (error) {
    console.error('Error fetching user state:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



app.post('/register', async (req, res) => {
  const { username, password } = req.body;


  console.log('Received data:', req.body); 

  
  if (username.length < 4 || password.length < 6) {
    return res.status(400).json({ message: 'Username must be at least 4 characters long and password must be at least 6 characters long' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    console.log('New user registered:', newUser);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    if (password !== existingUser.password) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    const token = jwt.sign({ userId: existingUser._id }, 'your-secret-key', { expiresIn: '15h' });
    res.json({ token });
  } catch (error) {
    console.error('Error authenticating user:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  res.redirect('/'); 
});

app.get('/check-auth', (req, res) => {
  if (req.session.isAuthenticated) {
      res.status(200).send("User is authenticated");
  } else {
      res.status(401).send("User is not authenticated");
  }
});


app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.user._id; 

  try {
    res.status(200).json({ userId }); 
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.get('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.params.id; 

  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(userId)) {
    return res.status(400).json({ message: 'Invalid ObjectID format' });
  }

  try {
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ userId: user._id }); 
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.post('/users/:userId/collections', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { name } = req.body;
  const userId = req.user._id; 

  try {
    const collection = new Collection({ name, userId });
    await collection.save();
    console.log('New collection saved:', collection);
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error saving collection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



app.get('/users/:userId/collections', async (req, res) => {
  const userId = req.params.userId; 

  try {
    const collections = await Collection.find({ userId });
    res.json(collections);
  } catch (error) {
    console.error('Error fetching user collections:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.get('/collections', async (req, res) => {
  try {
    const collections = await Collection.find();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching all collections:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



app.post('/collections', async (req, res) => {
  const { name } = req.body;
  try {
    const collection = new Collection({ name });
    await collection.save();
    console.log('New collection saved:', collection); 
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error saving collection:', error); 
    res.status(500).json({ message: 'Server Error' });
  }
});


app.get('/users/flashcards', async (req, res) => {
  const userid = req.user._id; 

  try {
    const flashcards = await Flashcard.find().populate({
      path: 'collectionId',
      match: { userId }
    });
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching user flashcards:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/collections/:collectionId', async (req, res) => {
  const collectionId = req.params.collectionId; 

  try {
    const collection = await Collection.findById(collectionId);
    if (collection) {
      res.status(200).json(collection); 
    } else {
      res.status(404).json({ message: 'Collection not found' });
    }
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.put('/collections/:id', async (req, res) => {
  const collectionId = req.params.id;
  const { name } = req.body;
  try {
    const updatedCollection = await Collection.findByIdAndUpdate(collectionId, { name }, { new: true });
    if (!updatedCollection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection name:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/collections/:collectionId', async (req, res) => {
  const collectionId = req.params.collectionId;

  try {
    const deletedCollection = await Collection.findOneAndDelete({ _id: collectionId });
    if (!deletedCollection) {
      console.log('Collection not found');
      return res.status(404).json({ message: 'Collection not found' });
    }
    console.log('Collection deleted successfully');
    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/collections/:collectionId/cards', async (req, res) => {
  const collectionId = req.params.collectionId;
  try {
    const flashcards = await Flashcard.find({ collectionId });
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards for collection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/collections/:collectionId/cards', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const collectionId = req.params.collectionId; 
  const { question, answer } = req.body; 
  const userId = req.user._id; 

  try {
    const collection = await Collection.findOne({ _id: collectionId, userId });
    if (!collection) {
      return res.status(403).json({ message: 'You are not authorized to add cards to this collection' });
    }
    
    const flashcard = new Flashcard({ collectionId, question, answer });
    await flashcard.save();

    collection.flashcard.push(flashcard._id);
    await collection.save();

    console.log('New flashcard saved:', flashcard);
    res.status(201).json({ flashcardId: flashcard._id }); 
  } catch (error) {
    console.error('Error saving flashcard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/collections/:collectionId/cards/:cardId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const collectionId = req.params.collectionId; 
  const cardId = req.params.cardId; 
  const { question, answer } = req.body; 
  const userId = req.user._id; 

  try {
    const collection = await Collection.findOne({ _id: collectionId, userId });
    if (!collection) {
      return res.status(403).json({ message: 'You are not authorized to edit cards in this collection' });
    }

    const flashcard = await Flashcard.findOne({ _id: cardId, collectionId });
    if (!flashcard) {
      return res.status(404).json({ message: 'Card not found in the specified collection' });
    }

    flashcard.question = question || flashcard.question;
    flashcard.answer = answer || flashcard.answer;
    await flashcard.save();

    console.log('Card updated successfully:', flashcard);
    res.status(200).json({ message: 'Card updated successfully', flashcard });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.delete('/collections/:collectionId/cards/:cardId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const collectionId = req.params.collectionId; 
  const cardId = req.params.cardId; 
  const userId = req.user._id; 

  try {
    const collection = await Collection.findOne({ _id: collectionId, userId });
    if (!collection) {
      return res.status(403).json({ message: 'You are not authorized to delete cards from this collection' });
    }

    const flashcard = await Flashcard.findOne({ _id: cardId, collectionId });
    if (!flashcard) {
      return res.status(404).json({ message: 'Card not found in the specified collection' });
    }

    await Flashcard.findByIdAndDelete(cardId);
    collection.flashcard = collection.flashcard.filter(id => id.toString() !== cardId);
    await collection.save();

    console.log('Card deleted successfully:', cardId);
    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/scores', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { collectionId, score } = req.body;
  const userId = req.user._id; 

  try {
    const newScore = new Score({ userId, collectionId, score });
    await newScore.save();
    res.status(201).json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/scores/user/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.params.userId;

  try {
    const userScores = await Score.find({ userId });
    res.status(200).json(userScores);
  } catch (error) {
    console.error('Error fetching user scores:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/scores/best', async (req, res) => {
  try {
    const bestScores = await Score.aggregate([
      {
        $group: {
          _id: "$collectionId",
          maxScore: { $max: "$score" }
        }
      },
      {
        $lookup: {
          from: "collections",
          localField: "_id",
          foreignField: "_id",
          as: "collection"
        }
      },
      {
        $unwind: "$collection"
      },
      {
        $project: {
          collectionName: "$collection.name",
          maxScore: 1
        }
      }
    ]);

    res.status(200).json(bestScores);
  } catch (error) {
    console.error('Error fetching best scores:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/scores/user/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const userId = req.params.userId;

  try {
      await Score.deleteMany({ userId });
      res.status(200).json({ message: 'User scores cleared successfully' });
  } catch (error) {
      console.error('Error clearing user scores:', error);
      res.status(500).json({ message: 'Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
