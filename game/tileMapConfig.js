const config = {
    MAP: { tw: 25, th: 20 },
    TILE: 32,
    EDGE_BUFFER: 5 // small distance to pad edges
}

config.WIDTH  = config.TILE * config.MAP.tw // 800
config.HEIGHT = config.TILE * config.MAP.th // 640
config.METER  = config.TILE // Helps us reasom about speeds and acceleration

module.exports = config