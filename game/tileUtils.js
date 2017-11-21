const tileMapConfig = require('./tileMapConfig')
const mapData = require('./assets/map').layers[0].data

module.exports = {
    t2p:   function(t)     { return t * tileMapConfig.TILE;  },
    p2t:   function(p)     { return Math.floor(p / tileMapConfig.TILE); },
    cell:  function(x,y)   { return tcell(p2t(x),p2t(y)); },
    tcell: function(tx,ty) { return mapData[tx + ( ty * tileMapConfig.MAP.tw ) ]; }
}