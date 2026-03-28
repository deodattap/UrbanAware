// src/routes/quiz.js
const router = require('express').Router();
const axios  = require('axios');
const { optionalAuth }                        = require('../middleware/auth');
const { updateUserScore, POINTS, clampScenarioScore } = require('../utils/scoring');

// ─────────────────────────────────────────────────────────────
// SECTION 1 — EXISTING question bank (10 questions, preserved)
// ─────────────────────────────────────────────────────────────
const LEGACY_QUESTIONS = [
  { id: 1,  q: 'Which is the most energy-efficient way to travel short distances?',      options: ['Electric SUV', 'Walking or Biking', 'Diesel Taxi', 'Motorbike'],                                correct: 1 },
  { id: 2,  q: 'What should you do with wet kitchen waste?',                             options: ['Burn it', 'Mix with plastic', 'Compost it', 'Flush it'],                                        correct: 2 },
  { id: 3,  q: 'How does carpooling help the environment?',                              options: ['Reduces traffic and emissions', 'Makes cars faster', 'Saves walking time', 'Increases fuel use'], correct: 0 },
  { id: 4,  q: 'Which is a major source of urban air pollution?',                        options: ['Solar panels', 'Bicycle lanes', 'Vehicle exhaust', 'Planting trees'],                            correct: 2 },
  { id: 5,  q: "What is recommended when AQI levels are 'Poor'?",                        options: ['Go for a run', 'Stay indoors, use air purifiers', 'Open all windows', 'Start a bonfire'],       correct: 1 },
  { id: 6,  q: 'Which light bulb is most energy-efficient?',                             options: ['Incandescent', 'Fluorescent', 'LED', 'Halogen'],                                                correct: 2 },
  { id: 7,  q: 'Where should you dispose of old electronics?',                           options: ['Regular bin', 'E-waste collection center', 'Nearest river', 'Bury in soil'],                    correct: 1 },
  { id: 8,  q: 'What is the best way to reduce plastic waste?',                          options: ['Use more plastic bags', 'Switch to reusable bags', 'Buy only bottled water', 'Throw in park'],   correct: 1 },
  { id: 9,  q: 'What does AQI stand for?',                                               options: ['Air Quality Index', 'Atmospheric Quality Indicator', 'Annual Quality Index', 'Air Quantity Index'], correct: 0 },
  { id: 10, q: 'Which practice most reduces the urban heat island effect?',              options: ['Dark asphalt roads', 'More concrete buildings', 'Rooftop gardens and trees', 'Removing parks'],  correct: 2 }
];

// ─────────────────────────────────────────────────────────────
// SECTION 2 — EXTENDED question pool (50 additional questions)
// ─────────────────────────────────────────────────────────────
const EXTENDED_QUESTIONS = [
  { id: 11, q: 'What percentage of global electricity is produced by renewable sources as of recent estimates?', options: ['About 10%', 'About 30%', 'About 60%', 'About 90%'], correct: 1 },
  { id: 12, q: 'Which gas is the primary contributor to the greenhouse effect from human activities?',           options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'],    correct: 2 },
  { id: 13, q: 'What is the most effective way to conserve water at home?',                                      options: ['Take longer showers', 'Fix leaky taps immediately', 'Water plants at noon', 'Leave taps running'], correct: 1 },
  { id: 14, q: 'Which type of bag is the most eco-friendly option for shopping?',                                options: ['Single-use plastic bag', 'Paper bag', 'Reusable cloth bag', 'Biodegradable plastic bag'], correct: 2 },
  { id: 15, q: 'What does the "3Rs" of sustainability stand for?',                                               options: ['Reduce, Reuse, Recycle', 'Renew, Rethink, Reform', 'Restore, Repurpose, Rebuild', 'Remove, Replace, Repair'], correct: 0 },
  { id: 16, q: 'Which household appliance typically consumes the most electricity?',                             options: ['Mobile phone charger', 'LED TV', 'Air conditioner', 'Ceiling fan'], correct: 2 },
  { id: 17, q: 'What is "urban farming"?',                                                                       options: ['Farming outside cities', 'Growing food within city limits', 'Industrial farming', 'Chemical-based crop growing'], correct: 1 },
  { id: 18, q: 'Which mode of transport produces zero direct carbon emissions?',                                 options: ['Electric car', 'Hybrid bus', 'Bicycle', 'CNG auto'], correct: 2 },
  { id: 19, q: 'What is the purpose of a rain garden?',                                                         options: ['To decorate streets', 'To capture and filter storm-water runoff', 'To store drinking water', 'To grow cash crops'], correct: 1 },
  { id: 20, q: 'Which color bin is typically used for dry recyclable waste?',                                    options: ['Green', 'Blue', 'Red', 'Black'], correct: 1 },
  { id: 21, q: 'What does "carbon footprint" measure?',                                                         options: ['Physical footprints on soil', 'Total greenhouse gas emissions caused by an individual or product', 'Carbon content of food', 'Shoe size of factory workers'], correct: 1 },
  { id: 22, q: 'Which of these is a renewable energy source?',                                                   options: ['Coal', 'Natural gas', 'Solar power', 'Petroleum'], correct: 2 },
  { id: 23, q: 'What is vermicomposting?',                                                                       options: ['Composting using worms', 'Burning waste in pits', 'Landfill waste disposal', 'Chemical treatment of soil'], correct: 0 },
  { id: 24, q: 'Which international agreement focuses on reducing greenhouse gas emissions?',                    options: ['Geneva Convention', 'Paris Agreement', 'Kyoto Summit', 'Brussels Protocol'], correct: 1 },
  { id: 25, q: 'What is "greenwashing"?',                                                                       options: ['Washing clothes using eco products', 'False claims of environmental friendliness by companies', 'Planting trees near factories', 'Using green paint in buildings'], correct: 1 },
  { id: 26, q: 'How does deforestation affect the climate?',                                                     options: ['Reduces CO2 levels', 'Increases CO2 levels and reduces rainfall', 'Has no measurable impact', 'Lowers global temperatures'], correct: 1 },
  { id: 27, q: 'Which is the best way to dispose of used cooking oil?',                                         options: ['Pour it down the drain', 'Throw it in regular trash', 'Take it to a recycling point', 'Burn it in open air'], correct: 2 },
  { id: 28, q: 'What does "net zero" mean in climate terms?',                                                    options: ['Zero energy usage', 'Balancing emissions produced with emissions removed', 'Zero pollution in rivers', 'Zero plastic use'], correct: 1 },
  { id: 29, q: 'Which practice helps reduce noise pollution in cities?',                                         options: ['Building more highways', 'Planting trees and green buffers', 'Adding more street lights', 'Removing parks'], correct: 1 },
  { id: 30, q: 'What is a "sustainable city"?',                                                                  options: ['A city with only electric cars', 'A city that meets current needs without compromising future generations', 'A city with no factories', 'A city that bans all vehicles'], correct: 1 },
  { id: 31, q: 'Which gas is released when organic matter decomposes in landfills?',                             options: ['Oxygen', 'Methane', 'Nitrogen', 'Carbon monoxide'], correct: 1 },
  { id: 32, q: 'What does "biodegradable" mean?',                                                               options: ['Cannot be recycled', 'Can be broken down naturally by microorganisms', 'Is made from recycled material', 'Is non-toxic'], correct: 1 },
  { id: 33, q: 'Which crop-based practice helps restore soil nutrients naturally?',                              options: ['Monoculture farming', 'Crop rotation', 'Over-irrigation', 'Use of chemical fertilisers'], correct: 1 },
  { id: 34, q: 'What is a biogas plant used for?',                                                              options: ['Generating electricity from coal', 'Producing gas from organic waste', 'Purifying river water', 'Manufacturing plastic'], correct: 1 },
  { id: 35, q: 'Which household action saves the most energy on a daily basis?',                                 options: ['Unplugging devices on standby', 'Using dark wallpaper', 'Buying new appliances', 'Opening windows at night'], correct: 0 },
  { id: 36, q: 'What is the main cause of ocean acidification?',                                                 options: ['Plastic pollution', 'Absorption of excess CO2 from atmosphere', 'Oil spills', 'Thermal pollution'], correct: 1 },
  { id: 37, q: 'Which of these actions is part of sustainable fashion?',                                         options: ['Buying fast fashion weekly', 'Donating or upcycling old clothes', 'Buying synthetic fabrics only', 'Discarding clothes after one use'], correct: 1 },
  { id: 38, q: 'What is the role of mangrove forests in coastal areas?',                                         options: ['They increase sea levels', 'They protect coastlines, store carbon and support biodiversity', 'They block fish migration', 'They cause flooding'], correct: 1 },
  { id: 39, q: 'What does "zero waste" lifestyle aim to achieve?',                                               options: ['Sending zero emails', 'Eliminating all waste sent to landfill by reducing and reusing', 'Reducing food intake', 'Using only digital products'], correct: 1 },
  { id: 40, q: 'Which behaviour most reduces food waste at home?',                                               options: ['Buying in bulk always', 'Meal planning before grocery shopping', 'Eating only packaged food', 'Freezing everything'], correct: 1 },
  { id: 41, q: 'Which of the following is an example of circular economy?',                                      options: ['Burying waste in landfills', 'Remanufacturing products from old parts', 'Importing goods from overseas', 'Using single-use packaging'], correct: 1 },
  { id: 42, q: 'What is "afforestation"?',                                                                       options: ['Cutting down forests', 'Planting trees in areas where there were none', 'Growing crops in forests', 'Burning forest land for agriculture'], correct: 1 },
  { id: 43, q: 'Which pollutant is most associated with acid rain?',                                             options: ['Carbon dioxide', 'Sulphur dioxide', 'Ozone', 'Hydrogen'], correct: 1 },
  { id: 44, q: 'What is grey water?',                                                                            options: ['Sea water', 'Wastewater from sinks, showers and laundry (not toilets)', 'Rainwater collected on rooftops', 'Water from underground wells'], correct: 1 },
  { id: 45, q: 'Which city planning feature most encourages walking and cycling?',                               options: ['Wide highways with no footpaths', 'Dedicated pedestrian and cycling lanes', 'Multi-level parking structures', 'Industrial zones near homes'], correct: 1 },
  { id: 46, q: 'What does LEED certification indicate for a building?',                                          options: ['It is earthquake resistant', 'It meets green building and sustainability standards', 'It has solar panels only', 'It uses imported materials'], correct: 1 },
  { id: 47, q: 'Which waste item takes the longest to decompose in a landfill?',                                 options: ['Newspaper', 'Glass bottle', 'Cotton cloth', 'Orange peel'], correct: 1 },
  { id: 48, q: 'What is the biggest driver of biodiversity loss globally?',                                      options: ['Climate change alone', 'Habitat destruction due to land use change', 'Hunting only', 'Natural disasters'], correct: 1 },
  { id: 49, q: 'Which practice is most effective for reducing urban flooding?',                                  options: ['Cutting down trees', 'Building more roads', 'Increasing permeable surfaces and green spaces', 'Expanding parking lots'], correct: 2 },
  { id: 50, q: 'What is a carbon offset?',                                                                       options: ['A tax on carbon producers', 'A way to compensate for emissions by funding equivalent carbon-saving projects', 'A certificate for clean energy', 'A device that absorbs CO2'], correct: 1 },
  { id: 51, q: 'Which of these materials is most difficult to recycle?',                                         options: ['Aluminium cans', 'Glass bottles', 'Styrofoam', 'Cardboard boxes'], correct: 2 },
  { id: 52, q: 'What is the primary purpose of an environmental impact assessment (EIA)?',                       options: ['To approve all construction projects', 'To evaluate the potential effects of a project on the environment', 'To increase industrial output', 'To sell land to developers'], correct: 1 },
  { id: 53, q: 'Which global event is observed on April 22 each year?',                                          options: ['World Environment Day', 'Earth Day', 'World Water Day', 'Biodiversity Day'], correct: 1 },
  { id: 54, q: 'What is phytoremediation?',                                                                      options: ['Using plants to remove contaminants from soil and water', 'A chemical process to purify air', 'Planting trees for shade', 'Burning polluted land'], correct: 0 },
  { id: 55, q: 'Which sector is the largest consumer of fresh water globally?',                                  options: ['Industrial manufacturing', 'Domestic households', 'Agriculture', 'Energy production'], correct: 2 },
  { id: 56, q: 'What does "smart grid" technology help achieve in cities?',                                      options: ['Faster internet speeds', 'More efficient electricity distribution and reduced energy waste', 'Automated traffic management', 'Water recycling'], correct: 1 },
  { id: 57, q: 'What is the Kyoto Protocol primarily about?',                                                    options: ['Nuclear disarmament', 'Reduction of greenhouse gas emissions by industrialised nations', 'Protecting ocean biodiversity', 'Regulating international trade'], correct: 1 },
  { id: 58, q: 'Which human activity is the largest source of nitrous oxide (N₂O) emissions?',                  options: ['Cement manufacturing', 'Aviation', 'Agricultural soil management and fertilisers', 'Coal mining'], correct: 2 },
  { id: 59, q: 'What is eco-tourism?',                                                                           options: ['Tourism that harms local ecosystems', 'Responsible travel to natural areas that conserves the environment', 'Luxury travel packages', 'Industrial tourism'], correct: 1 },
  { id: 60, q: 'Which clean cooking fuel is promoted to reduce indoor air pollution in rural areas?',            options: ['Firewood', 'Cow dung cakes', 'LPG and biogas', 'Kerosene lamps'], correct: 2 }
];

// Full merged pool
const ALL_QUESTIONS = [...LEGACY_QUESTIONS, ...EXTENDED_QUESTIONS];

// ─────────────────────────────────────────────────────────────
// SECTION 3 — SCENARIO bank (30 predefined, level-based)
// ─────────────────────────────────────────────────────────────
const SCENARIO_BANK = {
  easy: [
    {
      id: 'E01',
      level: 'easy',
      scenario: 'You notice that lights are left on in empty rooms at your home throughout the day. What steps would you take to reduce electricity wastage?',
      keywords: ['switch off', 'turn off', 'unplug', 'LED', 'timer', 'energy', 'electricity', 'habit', 'sensor', 'reminder', 'natural light', 'sunlight', 'awareness', 'reduce', 'save']
    },
    {
      id: 'E02',
      level: 'easy',
      scenario: 'Your neighbourhood has no dustbins nearby and people throw garbage on the street. What simple action can you personally take to improve this situation?',
      keywords: ['report', 'clean', 'dustbin', 'petition', 'community', 'volunteer', 'municipality', 'awareness', 'campaign', 'segregate', 'bins', 'initiative', 'organise', 'encourage', 'plastic']
    },
    {
      id: 'E03',
      level: 'easy',
      scenario: 'A tap in your school or office is dripping water constantly. No one seems to notice. What would you do?',
      keywords: ['repair', 'report', 'fix', 'maintenance', 'water', 'conserve', 'inform', 'notify', 'plumber', 'wastage', 'save', 'responsible', 'aware', 'action', 'authority']
    },
    {
      id: 'E04',
      level: 'easy',
      scenario: 'You are buying groceries. What eco-friendly choices can you make during your shopping trip to reduce waste?',
      keywords: ['reusable bag', 'cloth bag', 'avoid plastic', 'local produce', 'seasonal', 'bulk buy', 'packaging', 'reduce', 'organic', 'farmer market', 'minimal packaging', 'recycle', 'biodegradable', 'plan', 'list']
    },
    {
      id: 'E05',
      level: 'easy',
      scenario: 'Your family keeps the air conditioner running even when no one is in the room. How would you explain the environmental and financial impact to them?',
      keywords: ['electricity', 'bill', 'energy', 'cost', 'carbon', 'emission', 'climate', 'impact', 'switch off', 'thermostat', 'temperature', 'habit', 'reduce', 'efficient', 'pollution']
    },
    {
      id: 'E06',
      level: 'easy',
      scenario: 'You see someone burning plastic waste in an open area near your house. What would you do and why is this harmful?',
      keywords: ['harmful', 'toxic', 'fumes', 'health', 'pollution', 'air quality', 'report', 'awareness', 'stop', 'prevent', 'chemical', 'cancer', 'respiratory', 'ban', 'alternative']
    },
    {
      id: 'E07',
      level: 'easy',
      scenario: 'You want to start composting at home but live in a small apartment. What options are available to you?',
      keywords: ['compost', 'vermicompost', 'worms', 'kitchen waste', 'organic', 'balcony', 'small bin', 'reduce waste', 'soil', 'fertiliser', 'biodegradable', 'plant', 'recycle', 'pit', 'community']
    },
    {
      id: 'E08',
      level: 'easy',
      scenario: 'Your locality experiences frequent water shortages. What daily habits can you adopt to use water more responsibly?',
      keywords: ['bucket bath', 'shower', 'drip irrigation', 'rainwater', 'reuse', 'harvest', 'fix leaks', 'tap', 'grey water', 'conserve', 'aware', 'reduce', 'efficient', 'usage', 'track']
    },
    {
      id: 'E09',
      level: 'easy',
      scenario: 'You find a pile of e-waste (old phones, batteries, cables) at home. How should you dispose of it responsibly?',
      keywords: ['e-waste', 'recycling centre', 'collection', 'donate', 'manufacturer', 'takeback', 'hazardous', 'toxic', 'do not burn', 'landfill', 'responsible', 'certify', 'proper', 'facility', 'awareness']
    },
    {
      id: 'E10',
      level: 'easy',
      scenario: 'You want to reduce single-use plastic in your daily routine. List at least 3 specific changes you can make starting today.',
      keywords: ['bottle', 'straw', 'bag', 'cutlery', 'container', 'reusable', 'bamboo', 'metal', 'glass', 'refuse', 'carry', 'bring', 'avoid', 'replace', 'alternative']
    }
  ],
  medium: [
    {
      id: 'M01',
      level: 'medium',
      scenario: 'Your city wants to build a new coal power plant to meet rising energy demand. You are asked to present an alternative sustainable energy plan to the city council. What would you propose?',
      keywords: ['solar', 'wind', 'renewable', 'energy', 'grid', 'storage', 'battery', 'smart', 'efficiency', 'demand management', 'rooftop', 'policy', 'investment', 'jobs', 'transition']
    },
    {
      id: 'M02',
      level: 'medium',
      scenario: 'A river in your city is being polluted by a nearby industrial unit. Describe the steps you would take as a citizen and community leader to address this issue.',
      keywords: ['report', 'pollution control board', 'legal', 'awareness', 'campaign', 'media', 'petition', 'NGO', 'testing', 'water quality', 'community', 'protest', 'authority', 'evidence', 'law']
    },
    {
      id: 'M03',
      level: 'medium',
      scenario: 'Your school is planning to go green. As the student environment ambassador, design a sustainability action plan covering energy, water, and waste.',
      keywords: ['solar panel', 'LED', 'rainwater', 'composting', 'segregation', 'dustbin', 'garden', 'awareness', 'curriculum', 'campaign', 'energy audit', 'reduce', 'reuse', 'recycle', 'monitor']
    },
    {
      id: 'M04',
      level: 'medium',
      scenario: 'Urban heat islands are making your city hotter every summer. As a city planner, what measures would you implement to cool the city naturally?',
      keywords: ['trees', 'green roof', 'permeable surface', 'park', 'water body', 'reflective material', 'shade', 'vegetation', 'urban forest', 'plantation', 'cool pavement', 'design', 'reduce concrete', 'biodiversity', 'ecosystem']
    },
    {
      id: 'M05',
      level: 'medium',
      scenario: 'A large event is being organised in your city and is expected to generate massive waste. You are the event sustainability coordinator. What measures will you implement?',
      keywords: ['zero waste', 'segregation', 'composting', 'reusable', 'no single-use plastic', 'recycling station', 'digital', 'carbon offset', 'volunteer', 'awareness', 'local vendor', 'organic', 'banner', 'monitor', 'report']
    },
    {
      id: 'M06',
      level: 'medium',
      scenario: 'Air quality in your city has been consistently poor due to vehicle emissions and industrial activity. What policy and individual-level solutions would you recommend?',
      keywords: ['public transport', 'EV', 'carpool', 'odd-even', 'cycle lane', 'regulation', 'emission standard', 'industry', 'filter', 'monitor', 'AQI', 'green zone', 'awareness', 'penalty', 'tree plantation']
    },
    {
      id: 'M07',
      level: 'medium',
      scenario: 'Groundwater levels in your district are falling rapidly due to overextraction for agriculture. What sustainable water management practices would you advocate?',
      keywords: ['drip irrigation', 'rainwater harvesting', 'check dam', 'watershed', 'recharge', 'crop selection', 'drought-resistant', 'canal', 'aquifer', 'regulation', 'water audit', 'metering', 'community', 'policy', 'awareness']
    },
    {
      id: 'M08',
      level: 'medium',
      scenario: 'Your municipality is facing a landfill crisis with no space for more solid waste. Propose a comprehensive integrated solid waste management plan.',
      keywords: ['segregation', 'source', 'composting', 'biogas', 'recycling', 'reduce', 'door-to-door', 'processing plant', 'extended producer responsibility', 'awareness', 'informal sector', 'waste picker', 'SWM rules', 'material recovery', 'zero landfill']
    },
    {
      id: 'M09',
      level: 'medium',
      scenario: 'You are part of a resident welfare association. Monsoon flooding is a recurrent problem in your colony due to clogged drains. How would you address this long-term?',
      keywords: ['de-silting', 'clean', 'drain', 'permeable', 'rain garden', 'no littering', 'plantation', 'maintenance', 'municipal', 'report', 'community effort', 'SUDS', 'infiltration', 'tree cover', 'green infrastructure']
    },
    {
      id: 'M10',
      level: 'medium',
      scenario: 'Your city plans to replace all old diesel buses with electric buses. What challenges need to be addressed for a successful transition and what are the expected benefits?',
      keywords: ['charging infrastructure', 'grid', 'renewable energy', 'range', 'cost', 'battery', 'emission reduction', 'noise', 'maintenance', 'training', 'policy', 'subsidy', 'transition plan', 'air quality', 'public acceptance']
    }
  ],
  hard: [
    {
      id: 'H01',
      level: 'hard',
      scenario: 'You are an advisor to the national government tasked with creating a climate action roadmap to achieve net-zero emissions by 2070. What are the five most critical pillars of this roadmap and what trade-offs must be navigated?',
      keywords: ['renewable energy', 'carbon capture', 'industry decarbonisation', 'forest conservation', 'agriculture', 'just transition', 'finance', 'technology', 'international cooperation', 'policy framework', 'carbon tax', 'biodiversity', 'equity', 'monitoring', 'adaptation']
    },
    {
      id: 'H02',
      level: 'hard',
      scenario: 'A megacity of 15 million people is facing simultaneous crises: severe water scarcity, worsening air pollution, and rapid loss of green cover. Design an integrated urban resilience strategy to address all three issues concurrently within a 10-year timeframe.',
      keywords: ['integrated plan', 'water recycling', 'desalination', 'aquifer recharge', 'green infrastructure', 'urban forest', 'emission regulation', 'EV transition', 'circular economy', 'community participation', 'smart technology', 'governance', 'finance', 'monitoring', 'interdependency']
    },
    {
      id: 'H03',
      level: 'hard',
      scenario: 'Climate change is disproportionately affecting marginalised communities — those who contributed least to emissions. How would you design a climate justice framework that is both ambitious in emission reduction and equitable in distributing impacts and benefits?',
      keywords: ['climate justice', 'equity', 'vulnerable communities', 'adaptation', 'loss and damage', 'finance', 'technology transfer', 'indigenous knowledge', 'participation', 'human rights', 'just transition', 'gender', 'historical responsibility', 'reparations', 'community-led']
    },
    {
      id: 'H04',
      level: 'hard',
      scenario: 'You are the CEO of a large manufacturing company. Stakeholders are pressuring you to achieve carbon neutrality in 5 years without impacting profitability. Develop a credible decarbonisation strategy.',
      keywords: ['energy audit', 'renewable energy', 'efficiency', 'supply chain', 'scope 1 2 3', 'carbon offset', 'circular economy', 'product redesign', 'green procurement', 'employee engagement', 'SBTi', 'reporting', 'ESG', 'innovation', 'transition cost']
    },
    {
      id: 'H05',
      level: 'hard',
      scenario: 'Ocean plastic pollution has reached crisis levels. Design a comprehensive global governance framework to address the sources, transport pathways, and impacts of plastic pollution in marine environments.',
      keywords: ['extended producer responsibility', 'plastic treaty', 'waste management', 'circular economy', 'fishing industry', 'coastal communities', 'international law', 'UNEP', 'monitoring', 'innovation', 'biodegradable alternative', 'consumer behaviour', 'river interception', 'technology', 'finance']
    },
    {
      id: 'H06',
      level: 'hard',
      scenario: 'Food systems account for approximately one-third of global greenhouse gas emissions. Propose a systemic transformation of the global food system to become both sustainable and capable of feeding 10 billion people by 2050.',
      keywords: ['plant-based diet', 'precision agriculture', 'food waste reduction', 'regenerative farming', 'agroforestry', 'local food systems', 'technology', 'policy incentives', 'soil carbon', 'methane from livestock', 'supply chain', 'cold chain', 'equity', 'nutrition', 'biodiversity']
    },
    {
      id: 'H07',
      level: 'hard',
      scenario: 'Rapid melting of Arctic ice is opening new shipping routes and exposing vast mineral reserves. What are the geopolitical, environmental, and ethical implications of Arctic resource exploitation, and what governance framework is needed?',
      keywords: ['Arctic Council', 'indigenous rights', 'biodiversity', 'methane release', 'permafrost', 'sovereignty', 'international law', 'UNCLOS', 'climate feedback', 'ecosystem services', 'exploitation risk', 'moratorium', 'monitoring', 'scientific research', 'equity']
    },
    {
      id: 'H08',
      level: 'hard',
      scenario: 'Cities are responsible for over 70% of global CO2 emissions yet house only half the world\'s population. Design a globally scalable model for a carbon-neutral city of the future that balances economic growth, social equity, and environmental sustainability.',
      keywords: ['net zero building', 'smart grid', 'circular economy', 'active mobility', 'urban biodiversity', 'green finance', 'social housing', 'inclusive growth', 'digital infrastructure', 'participatory governance', 'climate adaptation', 'energy transition', 'water management', 'waste to energy', '15-minute city']
    },
    {
      id: 'H09',
      level: 'hard',
      scenario: 'Geoengineering proposals such as solar radiation management (SRM) are gaining attention as emergency climate interventions. Critically evaluate the potential benefits, risks, and ethical dimensions of deploying SRM at scale.',
      keywords: ['solar radiation management', 'stratospheric aerosol', 'carbon removal', 'termination shock', 'governance', 'moral hazard', 'unilateral action', 'regional impacts', 'monsoon disruption', 'biodiversity', 'intergenerational equity', 'precautionary principle', 'international agreement', 'scientific uncertainty', 'ethics']
    },
    {
      id: 'H10',
      level: 'hard',
      scenario: 'Biodiversity is declining at unprecedented rates with more than 1 million species facing extinction. Design a comprehensive global strategy to halt biodiversity loss by 2030 and restore ecosystems by 2050, integrating economic incentives with ecological imperatives.',
      keywords: ['30x30', 'protected areas', 'wildlife corridor', 'ecosystem restoration', 'payment for ecosystem services', 'invasive species', 'sustainable use', 'indigenous land rights', 'CBD', 'Kunming-Montreal', 'finance gap', 'nature-based solutions', 'private sector', 'monitoring', 'mainstreaming']
    }
  ]
};

// ─────────────────────────────────────────────────────────────
// SECTION 4 — Helpers
// ─────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a NEW shuffled array */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Pick one random item from an array */
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Rule-based smart evaluation.
 * Returns a percentage (0–100) based on keyword coverage, answer length, and practical action phrases.
 */
const smartEvaluate = (userAnswer, keywords) => {
  const lower = userAnswer.toLowerCase();

  // 1. Keyword match ratio (60% weight)
  const matchCount   = keywords.filter(k => lower.includes(k.toLowerCase())).length;
  const keywordScore = Math.min(matchCount / Math.max(keywords.length * 0.4, 1), 1); // hit 40% of keywords = full score

  // 2. Length quality (20% weight)
  const wordCount  = lower.split(/\s+/).filter(Boolean).length;
  const lengthScore = wordCount >= 50 ? 1 : wordCount >= 25 ? 0.7 : wordCount >= 10 ? 0.4 : 0.1;

  // 3. Practical action phrases (20% weight)
  const actionPhrases = ['i would', 'we should', 'one can', 'by doing', 'first', 'secondly', 'additionally',
                         'for example', 'such as', 'including', 'ensure', 'implement', 'install', 'create',
                         'introduce', 'start', 'adopt', 'build', 'promote', 'establish'];
  const actionHits  = actionPhrases.filter(p => lower.includes(p)).length;
  const actionScore = Math.min(actionHits / 3, 1); // 3+ action phrases = full score

  return Math.round((keywordScore * 0.6 + lengthScore * 0.2 + actionScore * 0.2) * 100);
};

/** Map level to max points */
const MAX_POINTS = { easy: 10, medium: 20, hard: 30 };

/** Generate level-appropriate feedback from percentage */
const buildFeedback = (percent, level, scenario) => {
  const maxPts = MAX_POINTS[level];
  const points = Math.max(1, Math.round((percent / 100) * maxPts));

  let feedback;
  if (percent >= 75) {
    feedback = 'Excellent response! You demonstrated strong practical knowledge and used specific, relevant actions.';
  } else if (percent >= 50) {
    feedback = 'Good effort! Your answer covers the key concepts. Try adding more specific actions and real-world examples to strengthen it.';
  } else if (percent >= 25) {
    feedback = 'You show some awareness of the topic. Focus on practical steps, keyword-rich reasoning, and structured arguments for a higher score.';
  } else {
    feedback = 'Your answer needs more depth. Think about the root causes, practical solutions, and community or policy-level actions you could propose.';
  }

  return {
    points,
    percent,
    feedback,
    correct_approach: `Ideal answers for ${level} scenarios mention relevant sustainability concepts, propose actionable steps, and demonstrate awareness of community or systemic impact.`,
    sustainability_tip: 'The strongest answers combine individual actions with community and policy-level thinking. Aim for depth and specificity.'
  };
};

// ─────────────────────────────────────────────────────────────
// SECTION 5 — ROUTES
// ─────────────────────────────────────────────────────────────

// GET /api/quiz/questions
// Returns 10 unique random questions from the full pool of 60
router.get('/questions', (req, res) => {
  const questions = shuffle(ALL_QUESTIONS).slice(0, 10).map(({ id, q, options, correct }) => ({
    id, question: q, options, correct   // expose correct so frontend can grade client-side
  }));
  res.json({ success: true, questions, total: ALL_QUESTIONS.length });
});

// POST /api/quiz/submit
// Accepts: { answers: [{ id, answer }] }   (answer = index 0-3)
// OR legacy: { score, total }
// Scoring: +5 points per correct answer
router.post('/submit', optionalAuth, async (req, res) => {
  try {
    const { answers, score: legacyScore, total: legacyTotal } = req.body;

    let correct = 0;
    let total   = 0;

    if (Array.isArray(answers) && answers.length > 0) {
      // New detailed submission path
      const questionMap = Object.fromEntries(ALL_QUESTIONS.map(q => [q.id, q]));
      total   = answers.length;
      correct = answers.filter(({ id, answer }) => {
        const q = questionMap[id];
        return q && Number(answer) === q.correct;
      }).length;
    } else {
      // Legacy fallback: client calculated the score itself
      correct = Math.max(0, parseInt(legacyScore) || 0);
      total   = Math.max(correct, parseInt(legacyTotal) || correct);
    }

    const POINTS_PER_CORRECT = 5;
    const points = correct * POINTS_PER_CORRECT;

    if (req.user && points > 0) {
      await updateUserScore(
        req.user,
        points,
        'quiz',
        `Quiz Completed: ${correct}/${total} correct`
      );
    }

    res.json({
      success: true,
      correct,
      total,
      points,
      message: `Quiz complete! You got ${correct}/${total} correct and earned ${points} points.`
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/quiz/scenario
// Handles two flows:
//   1. { level } only  → return a random scenario for that level
//   2. { level, scenarioId, answer } → evaluate the answer and award points
router.post('/scenario', optionalAuth, async (req, res) => {
  try {
    const { level, scenarioId, answer, scenario: legacyScenario, userAnswer: legacyAnswer } = req.body;

    // ── Legacy fallback (old clients send { scenario, userAnswer }) ──────
    if (!level && legacyScenario && legacyAnswer) {
      // Keep exact existing behaviour for old frontend
      const keywords = ['reduce', 'reuse', 'recycle', 'sustainable', 'environment',
                        'community', 'green', 'pollution', 'energy', 'waste'];
      const lower      = legacyAnswer.toLowerCase();
      const matchCount = keywords.filter(k => lower.includes(k)).length;
      const rawScore   = 4 + matchCount * 1.6;
      const points     = clampScenarioScore(rawScore);

      if (req.user && points > 0) {
        await updateUserScore(req.user, points, 'scenario', `Scenario Completed: ${points}/20`);
      }

      return res.json({
        success: true,
        evaluation: {
          score: points,
          feedback: points >= 14
            ? 'Great answer! You demonstrated strong sustainability awareness.'
            : points >= 8
            ? 'Good effort! Try to be more specific about community impact.'
            : 'Consider focusing more on sustainable practices and long-term impact.',
          correct_approach: 'Ideal answers mention reducing waste at source, community engagement, and measurable impact.',
          sustainability_tip: 'Track your carbon footprint to make your sustainability journey measurable.'
        },
        points
      });
    }

    // ── New flow ──────────────────────────────────────────────────────────
    const validLevels = ['easy', 'medium', 'hard'];
    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'level is required and must be "easy", "medium", or "hard".'
      });
    }

    const pool = SCENARIO_BANK[level];

    // Flow 1: No answer provided → return a random scenario
    if (!answer) {
      const picked = randomPick(pool);
      return res.json({
        success:  true,
        scenario: { id: picked.id, level: picked.level, scenario: picked.scenario }
      });
    }

    // Flow 2: Answer provided → evaluate
    let targetScenario;
    if (scenarioId) {
      targetScenario = pool.find(s => s.id === scenarioId);
      if (!targetScenario) {
        return res.status(404).json({ success: false, message: 'Scenario not found for this level.' });
      }
    } else {
      // No scenarioId given — pick random (evaluation still works consistently)
      targetScenario = randomPick(pool);
    }

    const percent    = smartEvaluate(answer, targetScenario.keywords);
    const evaluation = buildFeedback(percent, level, targetScenario.scenario);

    if (req.user && evaluation.points > 0) {
      await updateUserScore(
        req.user,
        evaluation.points,
        'scenario',
        `Scenario Completed (${level}): ${evaluation.points}/${MAX_POINTS[level]} pts`
      );
    }

    return res.json({
      success: true,
      scenario:   { id: targetScenario.id, level: targetScenario.level, scenario: targetScenario.scenario },
      evaluation: {
        score:              evaluation.points,
        maxScore:           MAX_POINTS[level],
        percentRelevance:   evaluation.percent,
        feedback:           evaluation.feedback,
        correct_approach:   evaluation.correct_approach,
        sustainability_tip: evaluation.sustainability_tip
      },
      points: evaluation.points
    });
  } catch (err) {
    console.error('Scenario error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
