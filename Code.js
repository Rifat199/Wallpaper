function autoScrapeAndUploadWallpapersMultiSource() {
  var imgbbApiKey = "475440804bcea6371364911682370b57";
  var firebaseDbUrl = "https://wallpaper-76b9a-default-rtdb.asia-southeast1.firebasedatabase.app/wallpapers/islamic.json";
  
  // খাঁটি ইসলামিক ছবির জন্য নির্দিষ্ট ও নিখুঁত কিওয়ার্ডের তালিকা
  var islamicQueries = [
    "Mosque", "Kaaba", "Makkah", "Madinah", "Quran", 
    "Masjid", "Islamic architecture", "Islamic calligraphy", 
    "Prophet Mosque", "Hajj", "Islamic prayer", 
    "Muslim praying", "Ramadan lantern", "Islamic art", "Dome of the Rock"
  ];
  
  var randomQuery = islamicQueries[Math.floor(Math.random() * islamicQueries.length)];
  
  // তিন প্ল্যাটফর্মের এপিআই কি
  var pixabayKey = "51521104-24545ed8e6e3dc875e58e0b48";
  var pexelsKey = "iFzv2MvjEgppK1E1wvC50V198SaYx5wZvlbPVfl44TKjUSvFgK7Bw79E";
  var unsplashKey = "0GkabyEH1jwVqoOamlVN1eR5qisvO4QIZISq_gCbMf4";

  // তিনটি সোর্স থেকে সমানভাবে ছবি নেওয়ার অ্যারে
  var sources = ["pixabay", "pexels", "unsplash"];
  var chosenSource = sources[Math.floor(Math.random() * sources.length)];
  
  var searchUrl = "";
  var fetchOptions = {};

  if (chosenSource === "pixabay") {
    searchUrl = "https://pixabay.com/api/?key=" + pixabayKey + "&q=" + encodeURIComponent(randomQuery) + "&image_type=photo&orientation=vertical&safesearch=true&per_page=15";
  } else if (chosenSource === "pexels") {
    searchUrl = "https://api.pexels.com/v1/search?query=" + encodeURIComponent(randomQuery) + "&orientation=portrait&per_page=15";
    fetchOptions = { "headers": { "Authorization": pexelsKey } };
  } else if (chosenSource === "unsplash") {
    searchUrl = "https://api.unsplash.com/search/photos?query=" + encodeURIComponent(randomQuery) + "&orientation=portrait&per_page=15&client_id=" + unsplashKey;
  }

  try {
    // ফায়ারবেস থেকে ডুপ্লিকেট চেক করতে বিদ্যমান ডাটা আনা
    var existingDataResponse = UrlFetchApp.fetch(firebaseDbUrl);
    var existingWallpapers = JSON.parse(existingDataResponse.getContentText()) || {};
    var existingUrls = [];
    for (var key in existingWallpapers) {
      if (existingWallpapers[key].sourceUrl) {
        existingUrls.push(existingWallpapers[key].sourceUrl);
      }
    }

    var response = UrlFetchApp.fetch(searchUrl, fetchOptions);
    var data = JSON.parse(response.getContentText());
    var hits = [];

    // সঠিক সোর্স অনুযায়ী ছবির লিংক সংগ্রহ ও সাইজ অপ্টিমাইজ করা
    if (chosenSource === "pixabay" && data.hits) {
      hits = data.hits.map(item => item.largeImageURL);
    } else if (chosenSource === "pexels" && data.photos) {
      // অতিরিক্ত বড় সাইজ এড়াতে large ব্যবহার করা হয়েছে যাতে আপলোড ফেইল না করে
      hits = data.photos.map(item => item.src.large || item.src.portrait);
    } else if (chosenSource === "unsplash" && data.results) {
      hits = data.results.map(item => item.urls.regular);
    }

    if (hits.length > 0) {
      hits.forEach(function(sourceImageUrl) {
        // ছবি আগে থেকে ফায়ারবেসে না থাকলে তবেই আপলোড হবে
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
              category: "islamic",
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
            
            // ফায়ারবেসের ইসলামিক ফোল্ডারে সেভ করা
            UrlFetchApp.fetch(firebaseDbUrl, firebaseOptions);
          }
        }
      });
    }
  } catch (error) {
     Logger.log("Error: " + error.toString());
  }
}
