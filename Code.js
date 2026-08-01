function autoScrapeAndUploadWallpapers() {
  var imgbbApiKey = "475440804bcea6371364911682370b57";
  var firebaseDbUrl = "https://wallpaper-76b9a-default-rtdb.asia-southeast1.firebasedatabase.app/wallpapers.json";
  
  // ক্যাটাগরি অনুযায়ী সার্চ কিউয়ার্ডের তালিকা
  var categoriesData = [
    { category: "islamic", queries: ["Islamic wallpaper", "Quran wallpaper", "Mecca wallpaper", "Allah calligraphy wallpaper", "Islamic art background", "Mosque architecture wallpaper", "Madina wallpaper", "Ramadan wallpaper", "Eid Mubarak background", "Islamic quotes wallpaper", "Kaaba background", "Islamic golden art"] },
    { category: "hindu", queries: ["Hindu god wallpaper", "Shivling background", "Radha Krishna wallpaper", "Mahadev wallpaper", "Durga maa wallpaper", "Ganesha wallpaper", "Hanuman wallpaper"] },
    { category: "christian", queries: ["Jesus Christ wallpaper", "Cross wallpaper", "Bible background", "Church wallpaper", "Christian aesthetic background"] },
    { category: "buddhist", queries: ["Buddha wallpaper", "Lord Buddha background", "Buddhist temple wallpaper", "Zen background"] },
    { category: "nature", queries: ["HD nature wallpaper", "sunset beautiful wallpaper", "mountain landscape wallpaper", "galaxy background", "aesthetic dark wallpaper"] },
    { category: "flowers", queries: ["flower aesthetic background", "red rose love background", "cherry blossom wallpaper", "tulip flowers background"] },
    { category: "buildings", queries: ["Mosque architecture wallpaper", "modern architecture wallpaper", "cityscape building background", "ancient palace wallpaper"] },
    { category: "love", queries: ["beautiful love wallpaper", "romantic cute wallpaper", "heart aesthetic wallpaper", "lovely couples background", "cute love wallpaper", "sweet couple wallpaper", "romantic aesthetic wallpaper"] },
    { category: "animals", queries: ["cute animal wallpaper", "wildlife nature wallpaper", "birds flying wallpaper", "cute cat dog background"] },
    { category: "cityscapes", queries: ["city lights wallpaper", "night city background", "urban street wallpaper", "skyscraper skyline background"] }
  ];
  
  // র‍্যান্ডমলি একটি ক্যাটাগরি এবং তার ভেতর থেকে একটি কুয়েরি সিলেক্ট করা
  var randomCategoryObj = categoriesData[Math.floor(Math.random() * categoriesData.length)];
  var randomQuery = randomCategoryObj.queries[Math.floor(Math.random() * randomCategoryObj.queries.length)];
  var selectedCategory = randomCategoryObj.category;
  
  var pixabayPublicApiKey = "51521104-24545ed8e6e3dc875e58e0b48";
  var searchUrl = "https://pixabay.com/api/?key=" + pixabayPublicApiKey + "&q=" + encodeURIComponent(randomQuery) + "&image_type=photo&orientation=vertical&safesearch=true&per_page=10";

  try {
    var existingDataResponse = UrlFetchApp.fetch(firebaseDbUrl);
    var existingWallpapers = JSON.parse(existingDataResponse.getContentText()) || {};
    var existingUrls = [];
    for (var key in existingWallpapers) {
      if (existingWallpapers[key].sourceUrl) {
        existingUrls.push(existingWallpapers[key].sourceUrl);
      }
    }

    var response = UrlFetchApp.fetch(searchUrl);
    var data = JSON.parse(response.getContentText());

    if (data.hits && data.hits.length > 0) {
      data.hits.forEach(function(item) {
        var sourceImageUrl = item.largeImageURL;
        
        if (existingUrls.indexOf(sourceImageUrl) === -1) {
          var imageBlob = UrlFetchApp.fetch(sourceImageUrl).getBlob();
          
          var imgbbOptions = {
            "method": "post",
            "payload": {
              "key": imgbbApiKey,
              "image": Utilities.base64Encode(imageBlob.getBytes())
            }
          };
          
          var imgbbResponse = UrlFetchApp.fetch("https://api.imgbb.com/1/upload", imgbbOptions);
          var imgbbResult = JSON.parse(imgbbResponse.getContentText());
          
          if (imgbbResult.success) {
            var finalImgbbUrl = imgbbResult.data.url;
            
            var payload = JSON.stringify({
              url: finalImgbbUrl,
              sourceUrl: sourceImageUrl,
              category: selectedCategory, // সঠিক ক্যাটাগরি নাম সেভ করা হচ্ছে
              downloads: 0,
              likes: 0,
              dislikes: 0,
              timestamp: new Date().getTime()
            });
            
            var firebaseOptions = {
              "method": "post",
              "contentType": "application/json",
              "payload": payload
            };
            
            UrlFetchApp.fetch(firebaseDbUrl, firebaseOptions);
          }
        }
      });
    }
  } catch (error) {
     Logger.log("Error: " + error.toString());
  }
}
