const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v7y5nyp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // all toy collection
    const toysCollection = client.db("kidToys").collection("toys");

    app.get("/allToys", async (req, res) => {
      const search = req.query.search;
      console.log(search);
      const query = { toyName: { $regex: search, $options: "i" } }

      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    
    app.get("/allToys/:text", async (req, res) => {
      console.log(req.params.text);
      if (
        req.params.text == "Car" ||
        req.params.text == "Truck" ||
        req.params.text == "Bus"
      ) {
        const result = await toysCollection
          .find({ subCategory: req.params.text })
          .toArray();
          console.log(result);
        return res.send(result);
      }
      const result = await toysCollection.find({}).toArray();
      res.send(result);
    });

    app.get("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        // sort matched documents in descending order by rating
        sort: { "imdb.rating": -1 },
        // Include only the `title` and `imdb` fields in the returned document
        projection: {
          seller: 1,
          availableQuantity: 1,
          picture: 1,
          rating: 1,
          price: 1,
          toyName: 1,
          detailsDescription: 1,
        },
      };

      const result = await toysCollection.findOne(query, options);
      res.send(result);
    });


    // add toy
    const toyCollection = client.db("newToys").collection("toy");

    app.get("/toy", async (req, res) => {
      const cursor = toyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myToys/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    app.post("/toy", async (req, res) => {
      const newToy = req.body;
      console.log(newToy);
      const result = await toyCollection.insertOne(newToy);
      res.send(result);
    });

    // update toy
    app.put("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = req.body;
      const toy = {
        $set: {
          price: updatedToy.price,
          quantity: updatedToy.quantity,
          description: updatedToy.description,
        },
      };
      const result = await toyCollection.updateOne(filter, toy, options);
      res.send(result);
    });

    // delete toy
    app.delete("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("toys are running");
});

app.listen(port, () => {
  console.log(`Toys server is running on port ${port}`);
});
