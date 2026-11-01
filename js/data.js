/* Shop names describe this artistic scene, not claims about actual businesses. */
window.MarketData = {
  bounds: { minX: -3.1, maxX: 3.1, minZ: -80, maxZ: 20 },
  colors: { plum: '#2a0e1c', gold: '#ffc94d', stone: '#c1b29a', plaster: '#e2d6bd', terracotta: '#a95636', green: '#366747' },
  shops: [
    ['marigold','Marigold Garlands','బంతి పూలు','Fresh orange and yellow marigold malas, strung for doorways, weddings and daily puja.','flowers','#d8993d'],
    ['jasmine','Jasmine Strings','మల్లె పూలు','White jasmine buds threaded into fragrant strings for hair, home and temple offerings.','flowers','#64806d'],
    ['roses','Rose Bouquets','గులాబీ పూలు','Red and pink roses gathered into bouquets beside baskets of loose petals.','flowers','#a94f62'],
    ['seasonal','Seasonal Flowers','పూల దుకాణం','Lotus, chrysanthemums and seasonal blooms, arranged in shallow trays beneath a shaded awning.','flowers','#9a7554'],
    ['vegetables','Fresh Vegetables','కూరగాయలు','Tomatoes, brinjals, gourds and leafy greens fill reusable crates at this neighbourhood vegetable shop.','vegetables','#477663'],
    ['fruit','Fruit & Coconuts','పండ్లు కొబ్బరికాయలు','Bananas, sweet limes and coconuts share a shaded counter, ready for the kitchen or a family puja.','fruit','#c68c32'],
    ['bamboo','Bamboo Crafts','వెదురు కళలు','Bamboo poles, woven screens and handmade stools celebrate the skilled craft traditions of the market.','bamboo','#8a6a43'],
    ['pottery','Terracotta Pottery','మట్టి పాత్రలు','Earthen water pots, cooking vessels and diyas, shaped in clay and stacked with care.','pottery','#ad664b'],
    ['puja','Puja Essentials','పూజా సామగ్రి','Brass lamps, kumkum, incense and offering plates bring the everyday rituals of the market together.','puja','#947348'],
    ['spices','Spices & Grains','సుగంధ ద్రవ్యాలు','Open sacks of turmeric, chilli, coriander and grains bring rich colour to the street.','spices','#a7583f'],
    ['textiles','Sarees & Textiles','చీరలు వస్త్రాలు','Folded cottons and hanging sarees with woven borders, displayed in a bright, sheltered shopfront.','textiles','#626b89'],
    ['groceries','Neighbourhood Grocer','కిరాణా దుకాణం','Rice sacks, pulses, jars and everyday provisions keep the market woven into daily life.','groceries','#608173'],
    ['tea','Chai & Conversation','టీ దుకాణం','A steel kettle, glasses of chai and a shaded bench make a small pause in the market walk.','tea','#7b644b'],
    ['sweets','Traditional Sweets','మిఠాయిలు','Laddus, barfi and neatly arranged sweets fill the glass counter, ready for sharing and celebrations.','sweets','#b07948'],
    ['utensils','Brass & Steel','ఇత్తడి ఉక్కు పాత్రలు','Reflective steel vessels and warm brass utensils sit side by side with everyday cooking tools.','utensils','#62777b'],
    ['baskets','Baskets & Coir','బుట్టలు కొబ్బరి పీచు','Woven baskets, coir mats and useful household goods carry traditional materials into a modern market.','baskets','#967451']
  ].map(([id,name,telugu,desc,type,accent], i) => ({ id,name,telugu,desc,type,accent,side:i%2?1:-1,x:(i%2?1:-1)*7,z:-8-Math.floor(i/2)*9,tall:[0,3,6].includes(Math.floor(i/2)) }))
};
