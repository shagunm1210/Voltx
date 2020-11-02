const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const e = require("express");
const cors = require("cors");
const formidable = require("formidable");
var csv = require("csvtojson");
var axios = require("axios");
const jsk = require("modelscript/build/modelscript.cjs.js");
let dataset;
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const calculateMean = (array, key) => {
  let total = 0;
  let error = 0;
  for (let i = 0; i < array.length; i++) {
    if (parseFloat(array[i][key])) {
      total += parseFloat(array[i][key]);
    } else {
      error += 1;
    }
  }
  return total / (array.length - error);
};

const calculateDev = (array, key) => {
  let total = 0;
  let error = 0;
  let mean = calculateMean(array, key);
  for (let i = 0; i < array.length; i++) {
    if (parseFloat(array[i][key])) {
      total += Math.abs(Math.pow(parseFloat(array[i][key]) - mean, 2));
    } else {
      error = error + 1;
    }
  }

  return Math.sqrt(total / (array.length - error));
};

app.post("/fileUpload", (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    const [firstFileName] = Object.keys(files);

    res.json({ filename: firstFileName });

    csv()
      .fromFile(files["csvData"]["path"])
      .then((jsonObj) => {
        jsk
          .loadCSV(files["csvData"]["path"])
          .then(() => {
            var payload = JSON.stringify({
              userId: fields["userId"],
              productName: fields["productName"],
              productDesc: fields["productDesc"],
              data: jsonObj,
            });

            var config = {
              method: "post",
              url:
                "https://gsdd0y63f7.execute-api.us-east-1.amazonaws.com/default/uploadCSV",
              headers: {
                Origin: "http://localhost:3000",
                "x-api-key": "0VXurYj9qv3zVt2vtCfBlxpDWKTwsDw4XQUDCEzb",
                "Content-Type": "application/json",
              },
              data: payload,
            };

            axios(config)
              .then(function (response) {
                console.log(JSON.stringify(response.data));
              })
              .catch(function (error) {
                console.log("L61" + error);
              });
          });
      });
  });
});
// Server static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// });
