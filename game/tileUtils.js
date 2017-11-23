const tileMapConfig = require('./tileMapConfig')
const mapData = require('./assets/map').layers[0].data

function t2p(t) { 
    return t * tileMapConfig.TILE;  
}

function p2t(p) { 
    return Math.floor(p / tileMapConfig.TILE); 
}

function cell(x,y) { 
    return tcell(p2t(x),p2t(y)); 
}

function tcell(tx,ty) { 
    return mapData[tx + ( ty * tileMapConfig.MAP.tw ) ]; 
}

module.exports = {
    t2p,
    p2t,
    cell,
    tcell
}