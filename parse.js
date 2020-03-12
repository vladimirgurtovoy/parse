const request = require("request-promise");
const cheerio = require("cheerio");
const fs = require("browserify-fs");
const url = `https://cors-anywhere.herokuapp.com/tomato.ua/Mariupol/category/restaurant`;
let countRestaurants = 0;
let places = [];
//parse resrtaurants
const parse = async () => {
  const response = await request(url);
  let $ = cheerio.load(response, {
    xml: {
      normalizeWhitespace: true
    }
  });

  const companyCard = $(".search_item");
  const countAllRest = companyCard.length;
  companyCard.each((id, card) => {
    let domCard = $(card); //card of restaurants
    let title = domCard.find(".title").text();
    makeObject(domCard, title);
  });
  if (countRestaurants >= countAllRest) {
    places.forEach((place, index) => {
      makeFetchLocation(place, index); //find restaurants location
    });
    parseInfo();
  }
}; //<- end function parse()

parse(); //call function

//create object with restaurant info
function makeObject(domCard, title) {
  let obj = {
    type: "restaurants",
    name: title,
    href: domCard.find(".search_item_img").attr("href"),
    address: domCard.find(".address").text(),
    markerPosition: "",
    description: "",
    images: [],
    markerIcon: domCard
      .find(".search_item_img")
      .css("background-image")
      .replace(/.*\s?url\([\'\"]?/, "")
      .replace(/[\'\"]?\).*/, "")
  };
  countRestaurants++;
  places.push(obj);
} //end function makeObject()

//parse info about restaurant
async function parseInfo() {
  let infoUrl;
  for (place of places) {
    infoUrl =
      "https://cors-anywhere.herokuapp.com/" +
      place.href.replace("https://", "");
    let response = await request(infoUrl);
    let $ = cheerio.load(response, {
      xml: {
        normalizeWhitespace: true
      }
    });
    let info = $(".panel");
    if (info.find(".all").text().length == 0) {
      place.description = info.find(".text_content").text();
    } else {
      place.description = info.find(".all").text();
    }
    countRestaurants--;
  }
  if (countRestaurants == 0) {
    storeData(places, "./places.json");
    console.log(places);
  }

  // parseImages(infoUrl + "/photos");
} //end of function parseInfo()

//parse images for restaurants description
async function parseImages(imgUrl) {
  const response = await request(imgUrl);
  $ = cheerio.load(response, {
    xml: {
      normalizeWhitespace: true
    }
  });
  info = $(".image_block");
  // let images = info.find(".images_col>.image_block");
} //end of function parseImages()

//get location of restaurant on the map
async function makeFetchLocation(place, index) {
  let res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${"мариуполь " +
      place.name}&key=AIzaSyAfaEcMF7iaeuaK0VT8POocFReZ7IJ-LdQ`
  );
  let json = await res.json();
  let data = await json.results[0].geometry.location;
  place.markerPosition = [data.lat, data.lng];
} //end function of makeFetchLocation()

const storeData = (data, path) => {
  fs.writeFile(path, JSON.stringify(data), function(err) {
    if (err) {
      console.log(err);
    }
  });
  fs.readFile(path, "utf-8", function(err, dataF) {
    if (err) {
      console.log(err);
    } else {
      console.log(dataF);
    }
  });
};
