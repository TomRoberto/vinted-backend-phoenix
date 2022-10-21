const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../functions/convertToBase64");

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log("Je passe dans ma route");
      const { title, condition, price, description, city, brand, size, color } =
        req.body;
      //   console.log(req.user);
      //   console.log(req.body);
      //   console.log(req.files);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });
      // Optionnal chaining (avancé)
      if (req.files?.picture) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture)
        );
        newOffer.product_image = result;
      }
      console.log(newOffer);
      await newOffer.save();
      // J'aurais pu faire ça pour ne renvoyer que les clefs account et _id de mon user mais ça auraot fait une requête vers mongoDB dont on peut se passer
      //   const offer = await Offer.findById(newOffer._id).populate(
      //     "owner",
      //     "account"
      //   );
      //   console.log(offer);
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// router.get("/offers", async (req, res) => {
//   // FIND
//   //   const regExp = /Chaussure/i;
//   //   const regExp = new RegExp("robe", "i");
//   //   const result = await Offer.find({ product_name: regExp }).select(
//   //     "product_name product_price -_id"
//   //   );

//   //   FIND avec une fourchette de prix
//   //   $lte = lower than or equal <=
//   //   $gte = greater than or equal >=
//   //   $lt = lower than <
//   //   $gt = greater than >
//   //   const result = await Offer.find({
//   //     product_price: { $gte: 50, $lte: 100 },
//   //   }).select("product_name product_price -_id");

//   //   SORT
//   //   On précise une clef à la méthode sort qui contiendra
//   //   desc ou descneding ou -1 pour trier de manière décroissante
//   //   asc ascending ou 1 pour trier de manière croissante
//   //   const result = await Offer.find()
//   //     .sort({ product_price: -1 })
//   //     .select("product_name product_price");

//   //   ON PEUT TOUT CHAINER
//   //   Je veux chercher dans ma collection Offer, tous les éléments dont la clef product_name contient Chaussure, dont la clef product_price est >= 50 et je les veux par prix décroissant
//   //   const result = await Offer.find({
//   //     product_name: new RegExp("Chaussure", "i"),
//   //     product_price: { $gte: 50 },
//   //   })
//   //     .sort({ product_price: -1 })
//   //     .select("product_name product_price");

//   // SKIP ET LIMIT
//   //   const result = await Offer.find()
//   //     .skip(10)
//   //     .limit(5)
//   //     .select("product_name product_price");

//   const result = await Offer.find()
//     .sort({ product_price: 1 })
//     .skip(15)
//     .limit(5)
//     .select("product_name product_price");

//   res.json(result);
// });

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    // console.log(filters);
    if (priceMax) {
      if (!filters.product_price) {
        filters.product_price = { $lte: Number(priceMax) };
      } else {
        filters.product_price.$lte = Number(priceMax);
      }
    }
    // console.log(filters);

    const sortFilter = {};
    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // 5 resultats par page : 1 skip 0, 2 skip 5, 3 skip 10, 4 skip 15
    // 3 resultats par page : 1 skip 0, 2 skip 3, 3 skip 6, 4 skip 9
    const limit = 5;
    let pageRequired = 1;
    if (page) {
      pageRequired = Number(page);
    }

    const skip = (pageRequired - 1) * limit;

    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      // .select("product_name product_price owner")
      .populate("owner", "account _id");

    const offerCount = await Offer.countDocuments(filters);
    console.log(offerCount);

    res.json({ count: offerCount, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
