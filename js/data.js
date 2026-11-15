/* Shop names describe this artistic scene, not claims about actual businesses. */
window.MarketData = {
  bounds: { minX: -7.4, maxX: 3.1, minZ: -80, maxZ: 20 },
  /* Supplied model (assets/models/poorna-market.glb). Its road line (x 36.81 in model metres) sits on the
     street's left kerb at x -3.6; the street wall then runs z +3 to -79.6 and its three gates
     (canopies) centre on the z values below. */
  model: { url: 'assets/models/poorna-market.glb', nav: 'assets/models/poorna-market-nav', offset: { x: -40.41, z: -47.2 }, wallX: -11.85, wallTop: 5, zStart: 2.98, zEnd: -79.55,
    gates: [{ z: -24.55, name: 'North Gate', telugu: 'ఉత్తర ద్వారం' }, { z: -45.55, name: 'Main Gate', telugu: 'ప్రధాన ద్వారం' }, { z: -66.55, name: 'South Gate', telugu: 'దక్షిణ ద్వారం' }] },
  colors: { plum: '#2a0e1c', gold: '#ffc94d', stone: '#c1b29a', plaster: '#e2d6bd', terracotta: '#a95636', green: '#366747' },
  /* The guided tour covers the right-hand shops; the left side is the supplied market building. */
  shops: [
    ['jasmine','Jasmine Strings','మల్లె పూలు','White jasmine buds threaded into fragrant strings for hair, home and temple offerings.','flowers','#64806d'],
    ['seasonal','Seasonal Flowers','పూల దుకాణం','Lotus, chrysanthemums and seasonal blooms, arranged in shallow trays beneath a shaded awning.','flowers','#9a7554'],
    ['fruit','Fruit & Coconuts','పండ్లు కొబ్బరికాయలు','Bananas, sweet limes and coconuts share a shaded counter, ready for the kitchen or a family puja.','fruit','#c68c32'],
    ['pottery','Terracotta Pottery','మట్టి పాత్రలు','Earthen water pots, cooking vessels and diyas, shaped in clay and stacked with care.','pottery','#ad664b'],
    ['spices','Spices & Grains','సుగంధ ద్రవ్యాలు','Open sacks of turmeric, chilli, coriander and grains bring rich colour to the street.','spices','#a7583f'],
    ['groceries','Neighbourhood Grocer','కిరాణా దుకాణం','Rice sacks, pulses, jars and everyday provisions keep the market woven into daily life.','groceries','#608173'],
    ['sweets','Traditional Sweets','మిఠాయిలు','Laddus, barfi and neatly arranged sweets fill the glass counter, ready for sharing and celebrations.','sweets','#b07948'],
    ['baskets','Baskets & Coir','బుట్టలు కొబ్బరి పీచు','Woven baskets, coir mats and useful household goods carry traditional materials into a modern market.','baskets','#967451']
  ].map(([id,name,telugu,desc,type,accent], i) => ({ id,name,telugu,desc,type,accent,side:1,x:7,z:-7-i*10,tall:[0,3,6].includes(i) })),
  /* Street hawkers sit between the kerb and the market wall, never in front of a gate. */
  hawkers: [
    ['h-marigold','Marigold Seller','బంతి పూల అమ్మకం','Heaped marigolds and ready-strung malas, sold by the arm-length for doorways and puja.','flowers',-1],
    ['h-bangles','Bangle Seller','గాజుల అమ్మకం','Glass bangles in every colour, stacked on wooden rods and matched to a saree in seconds.','bangles',-6.5],
    ['h-tea','Roadside Chai','టీ బండి','A brass kettle on a charcoal stove and small glasses of sweet ginger chai.','tea',-12],
    ['h-banana','Banana Cart','అరటి పండ్ల బండి','Green and ripe banana bunches hung from the cart frame, sold by the dozen.','bananas',-17.5],
    ['h-coconut','Tender Coconuts','కొబ్బరి బొండాలు','Green tender coconuts, opened with a quick stroke of the machete and served with a straw.','coconut',-34],
    ['h-corn','Roasted Corn','మొక్కజొన్న పొత్తులు','Corn cobs roasted over glowing coals, rubbed with lime, salt and chilli.','corn',-39.5],
    ['h-jasmine','Jasmine Strings','మల్లె మాలలు','Fresh jasmine strung by hand into fragrant lengths for the hair.','jasmine',-56],
    ['h-vegetables','Greens Basket','ఆకుకూరలు','Leafy greens, drumsticks and small brinjals laid out on a woven mat.','vegetables',-61.5],
    ['h-peanuts','Roasted Peanuts','వేయించిన వేరుశనగ','Warm peanuts roasted in sand and twisted into paper cones.','peanuts',-72.5],
    ['h-toys','Toys & Balloons','బొమ్మలు బెలూన్లు','Bright balloons, spinning paper windmills and wooden toys for children on the market walk.','toys',-78]
  ].map(([id,name,telugu,desc,type,z]) => ({ id,name,telugu,desc,type,z,side:-1,x:-8.4,hawker:true })),
  /* Inside the market building: G+3 storeys (split-level wings joined by ramps) and what each sells. */
  floors: [
    { id: 'G', name: 'Ground Floor', telugu: 'భూ అంతస్తు', cats: ['flowers', 'vegetables', 'fruit'] },
    { id: '1', name: 'First Floor', telugu: 'మొదటి అంతస్తు', cats: ['flowers', 'vegetables', 'fruit'] },
    { id: '2', name: 'Second Floor', telugu: 'రెండవ అంతస్తు', cats: ['puja', 'dryfruit', 'spices'] },
    { id: '3', name: 'Third Floor', telugu: 'మూడవ అంతస్తు', cats: ['seafood', 'meat'] }
  ],
  categories: {
    flowers: { name: 'Flower Stalls', telugu: 'పూల దుకాణాలు', desc: 'Marigold heaps, jasmine and kanakambaram strings, roses and lotus for homes, weddings and temples.' },
    vegetables: { name: 'Vegetable Stalls', telugu: 'కూరగాయల దుకాణాలు', desc: 'Tomatoes, brinjals, gourds, drumsticks and fresh greens, brought in from nearby farms every dawn.' },
    fruit: { name: 'Fruit Stalls', telugu: 'పండ్ల దుకాణాలు', desc: 'Bananas, mangoes in season, papayas, oranges and apples stacked high on the counters.' },
    puja: { name: 'Pooja Stalls', telugu: 'పూజా సామగ్రి', desc: 'Brass lamps, kumkum and turmeric, camphor, incense and coconuts for daily worship and festivals.' },
    dryfruit: { name: 'Dry Fruit Stalls', telugu: 'డ్రై ఫ్రూట్స్', desc: 'Cashews, almonds, raisins, pistachios and dates sold by weight from shining bowls.' },
    spices: { name: 'Spice Stalls', telugu: 'సుగంధ ద్రవ్యాలు', desc: 'Cones of chilli, turmeric and coriander powder, pepper, cardamom and cloves filling the floor with aroma.' },
    seafood: { name: 'Sea Food', telugu: 'చేపలు రొయ్యలు', desc: "The morning catch from Visakhapatnam's harbour: seer fish, pomfret, prawns and crabs on beds of ice." },
    meat: { name: 'Meat Stalls', telugu: 'మాంసం దుకాణాలు', desc: 'Fresh chicken and mutton, cut to order on wooden blocks and weighed on brass scales.' }
  }
};
