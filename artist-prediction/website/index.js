var apigClient = apigClientFactory.newClient({
    apiKey : 'oa6eY7Nj5LauBbqqipj1M9QYIVuBQHYR4NefFdnk'
});

var fileName = ''
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition

function voiceSearch(){
    if ('SpeechRecognition' in window) {
        console.log("SpeechRecognition is Working");
    } else {
        console.log("SpeechRecognition is Not Working");
    }
    
    var inputSearchQuery = document.getElementById("search_query");
    const recognition = new window.SpeechRecognition();

    micButton = document.getElementById("mic_search");  
    
    if (micButton.innerHTML == "mic") {
        recognition.start();
    } else if (micButton.innerHTML == "mic_off"){
        recognition.stop();
    }

    recognition.addEventListener("start", function() {
        micButton.innerHTML = "mic_off";
        console.log("Recording.....");
    });

    recognition.addEventListener("end", function() {
        console.log("Stopping recording.");
        micButton.innerHTML = "mic";
    });

    recognition.addEventListener("result", resultOfSpeechRecognition);
    function resultOfSpeechRecognition(event) {
        const current = event.resultIndex;
        transcript = event.results[current][0].transcript;
        inputSearchQuery.value = transcript;
        console.log("transcript : ", transcript)
    }
}


function textSearch() {
    var searchText = document.getElementById('search_query');
    let selectedElement = document.querySelector('#dropdownMenuButton');
    console.log("selectedElement.value: ",selectedElement.value);
    if(selectedElement.value.toLowerCase() == 'description')
    {
        if (!searchText.value) {
            alert('Please enter a valid text or voice input!');
        } else {
            let searchQuery = searchText.value.trim();
            searchQuery = 'description:'+searchQuery;
            console.log('searchQuery: ',searchQuery);
            searchPhotos(searchQuery);
        }
    }
    else
    {
        let searchQuery = searchText.value.trim().toLowerCase();
        searchQuery = 'artist_name:'+'*'+searchQuery+'*';
        console.log('searchQuery: ',searchQuery);
        searchPhotos(searchQuery);
    }
}

function searchPhotoForPrediction() {
    console.log("searchPhotoForPrediction called")
    console.log("fileName: ",fileName);
    //let xhr3 = new XMLHttpRequest();
    //xhr3.withCredentials = false;
    let getURL = "https://32wixjqn85.execute-api.us-east-1.amazonaws.com/prod/predict/?q="+fileName

    const options = {
        method: 'GET'
    }
    fetch(getURL, options)
    .then((response)=>response.json())
    .then((data) => {
        console.log("data: ",data);
        if (data.predicted_artist !== undefined) {
            document.getElementById('predicted_text').innerHTML = "<p>The predicted artist is: "+data.predicted_artist+", prediction probability is: "+data.prediction_probability+"</p>";
            document.getElementById('predicted_text').style.display = 'block';
        }
        else
        {
            document.getElementById('predicted_text').innerHTML = "<p>Prediction is not yet ready please click again after some time.</p>";
            document.getElementById('predicted_text').style.display = 'block';
        }
    })
    .catch(error => console.error("error: ",error))
}

function uploadPhotoForPrediction() {
    console.log("uploadPhotoForPrediction called")
    let file = document.getElementById('uploaded_file').files[0];
    fileName = file.name;
    let file_type = file.type;
    let reader = new FileReader();
    reader.onload = function() {
        let arrayBuffer = this.result;
        let blob = new Blob([new Int8Array(arrayBuffer)], {
            type: file_type
        });
        let blobUrl = URL.createObjectURL(blob);
        let data = document.getElementById('uploaded_file').files[0];
        let xhr = new XMLHttpRequest();
        console.log(apiGateway.core.utils)
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {                
                document.getElementById('uploadText').innerHTML ='Image Uploaded  !!!';
                document.getElementById('uploadText').style.display = 'block';
                document.getElementById("find_artist").style.visibility='visible';
            }
        });
        xhr.withCredentials = false;
        xhr.open("PUT", "https://32wixjqn85.execute-api.us-east-1.amazonaws.com/prod/upload/artistpredict/"+data.name);
        xhr.setRequestHeader("x-api-key","oa6eY7Nj5LauBbqqipj1M9QYIVuBQHYR4NefFdnk");
        xhr.setRequestHeader("content-type", "application/json");
        xhr.setRequestHeader("Access-Control-Allow-Methods", "OPTIONS,PUT");
        xhr.setRequestHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token");
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhr.send(data);
    };
    reader.readAsArrayBuffer(file);
}

function uploadPhoto() {
    console.log("Upload called")
    let file = document.getElementById('uploaded_file').files[0];
    fileName = file.name;
    let file_type = file.type;
    let reader = new FileReader();
    console.log("custom_labels: ", custom_labels.value.toString());
    reader.onload = function() {
        let arrayBuffer = this.result;
        let blob = new Blob([new Int8Array(arrayBuffer)], {
            type: file_type
        });
        let blobUrl = URL.createObjectURL(blob);
        let data = document.getElementById('uploaded_file').files[0];
        let xhr = new XMLHttpRequest();
        console.log(apiGateway.core.utils)
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {                
                document.getElementById('uploadText').innerHTML ='Image Uploaded  !!!';
                document.getElementById('uploadText').style.display = 'block';
            }
        });
        console.log("artist description: ",artist_name.value.toString())
        xhr.withCredentials = false;
        xhr.open("PUT", "https://32wixjqn85.execute-api.us-east-1.amazonaws.com/prod/upload/artpiecesstorage/"+data.name);
        xhr.setRequestHeader("x-api-key","oa6eY7Nj5LauBbqqipj1M9QYIVuBQHYR4NefFdnk");
        xhr.setRequestHeader("x-amz-meta-customlabels", custom_labels.value.toString());
        xhr.setRequestHeader("x-amz-meta-artistname", artist_name.value.toString());
        xhr.setRequestHeader("x-amz-meta-description", artist_description.value.toString());
        xhr.setRequestHeader("x-amz-meta-price", price.value.toString());
        xhr.setRequestHeader("Access-Control-Allow-Methods", "OPTIONS,PUT");
        xhr.setRequestHeader("Access-Control-Allow-Headers", "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token");
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhr.send(data);
    };
    reader.readAsArrayBuffer(file);
}


function searchPhotos(searchText) {
    console.log(searchText);
    // var params = {
    //     'q' : searchText,
    //     'accept':'image/*',
    //     'x-api-key' : 'oa6eY7Nj5LauBbqqipj1M9QYIVuBQHYR4NefFdnk',
        
    // };

    var params = {q : searchText, 'Access-Control-Allow-Methods':'GET,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*'};
    let photosDiv = document.getElementById("photo_search");
    photosDiv.innerHTML = "";
    html_content = []
    apigClient.searchGet(params, {}, {})
        .then(function(result) {
            image_paths = result["data"];
            var n;
            for (n = 0; n < image_paths.length; n++) {
                image_path_json = image_paths[n]
                img_path = image_path_json['file_name'];
                console.log("img_path: ",img_path)
                images_list = img_path.split('/');
                imageName = images_list[images_list.length - 1];
                content = '<figure><img src="' + img_path + '" style="width:25%"><figcaption>' + image_path_json['artist_name'] + '</figcaption></figure>'+'<p>Price: '+image_path_json['price']+'</p>'+'<p> About Product: '+image_path_json['description']+'</p>';
                html_content.push(content);
            }
            console.log("html_content: ",html_content)
            if(html_content.length == 0)
            {
                photosDiv.innerHTML += "<h4 style=\"margin-left:520px;\">Sorry! No results found!</h4>";
            }
            else
            {
                if(html_content.length > 2)
                {
                    for (var i = 0; i < html_content.length; i++) {
                        photosDiv.innerHTML += '<div class="col-md-3" style="text-align:center">'+html_content[i]+'</div>'
                    }
                }
                else if(html_content.length == 2)
                {
                    for (var i = 0; i < html_content.length; i++) {
                        photosDiv.innerHTML += '<div class="col-md-6" style="text-align:center">'+html_content[i]+'</div>'
                    }
                }
                else if(html_content.length == 1)
                {
                    for (var i = 0; i < html_content.length; i++) {
                        photosDiv.innerHTML += '<div class="col-md-12" style="text-align:center">'+html_content[i]+'</div>'
                    }
                }
            }
        }).catch(function(result) {
            console.log("result: ",result);
            photosDiv.innerHTML += "<h4 style=\"margin-left:520px;\">Sorry! No results found!</h4>";
        });
}

function readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
  
      reader.onload = function (e) {
        $('#display_image').attr('src', e.target.result).width(150).height(200);
        $('#display_image_div').css('visibility','visible')
      };
  
      reader.readAsDataURL(input.files[0]);
    }
  }

function getPrediction(searchText) {
    console.log(searchText);
    document.getElementById('search_query').value = searchText;
    document.getElementById('photos_search_results').innerHTML = "<h4 style=\"text-align:center\">";

    var params = {
        'q' : searchText,
        'accept':'image/*',
        'x-api-key' : 'oa6eY7Nj5LauBbqqipj1M9QYIVuBQHYR4NefFdnk',
        'Access-Control-Allow-Methods':'GET,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*'
    };

    var body = { };
    var params = {q : searchText};
    var additionalParams = {
        headers: {
            'Content-Type':"application/json",
            'Access-Control-Allow-Methods':'GET,OPTIONS',
    }};
    apigClient.searchGet(params, {}, {})
        .then(function(result) {
            console.log("Result : ", result);
            image_paths = result["data"];
            var photosDiv = document.getElementById("photos_search_results");
            photosDiv.innerHTML = "";

            var n;
            for (n = 0; n < image_paths.length; n++) {
                images_list = image_paths[n].split('/');
                imageName = images_list[images_list.length - 1];
                photosDiv.innerHTML += '<figure><img src="' + image_paths[n] + '" style="width:25%"><figcaption>' + imageName + '</figcaption></figure>';
            }

        }).catch(function(result) {
            var photosDiv = document.getElementById("photos_search_results");
            photosDiv.innerHTML = "Some error occurred in prediction";
            console.log(result);
        });
}


function uploadPhoto2(){
    var file = document.getElementById('uploaded_file').files[0];
    var type_file_up = file.type;
    var name_f = file.name;
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    reader.onload = function (event) {
        console.log("Reader Object",event.target.result)
        console.log("Reader ",reader.result)
        var file = new Uint8Array(reader.result);
        var requestOptions = {
            method: 'PUT',
            headers: {
                "x-amz-meta-customlabels" : custom_labels.value.toString(), 
                "content-type": type_file_up, 
                "Access-Control-Allow-Headers":"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token", 
                "Access-Control-Allow-Methods": "OPTIONS,PUT", 
                "Access-Control-Allow-Origin": "*"
            },
            body: file,
            redirect: 'follow'
        };
    
        console.log("re headers ====>>>>", requestOptions);
        fetch(`https://32wixjqn85.execute-api.us-east-1.amazonaws.com/prod/upload/artpiecesstorage/${name_f}`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result)).then(alert("Photo uploaded successfully!"))
        .catch(error => console.log('error', error));
    }
}
