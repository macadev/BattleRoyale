export function randomColor(brightness){
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

function randomChannel(brightness){
    var r = 255-brightness;
    var n = 0|((Math.random() * r) + brightness);
    var s = n.toString(16);
    return (s.length==1) ? '0'+s : s;
}