function uploadImageFile(file, requestData, callback) {
    if (!file)return;
    const reader = new FileReader();
    switch (requestData.action){
        case ApiUploadFile.CARD:
        case ApiUploadFile.LOGO:
            reader.onload = function () {
                const base64Data = reader.result.split(",")[1];
                const data = Object.assign({}, requestData, {data:base64Data});
                apiPost(ApiRoute.upImage, data).then(callback);
            };
            reader.readAsDataURL(file);
            break;
    }
}
