// Script to verify Mexican city/region subreddits exist on Reddit
const https = require('https');

const candidates = [
  // Major cities not yet in file
  'Acapulco', 'PuertoVallarta', 'Queretaro', 'Leon', 'Puebla',
  'SanMiguelDeAllende', 'PlayaDelCarmen', 'Mazatlan', 'Ensenada',
  'CiudadJuarez', 'Saltillo', 'Tampico', 'Veracruz', 'Pachuca',
  'Cuernavaca', 'Oaxaca', 'SanCristobalDeLasCasas', 'Zacatecas',
  'Aguascalientes', 'Tepic', 'Durango', 'Chihuahua', 'Torreon',
  'Reynosa', 'Matamoros', 'NuevoLaredo', 'Nogales', 'LosCabos',
  'CaboSanLucas', 'LasPaz', 'Guanajuato', 'Irapuato', 'Celaya',
  'Salamanca', 'SanLuisPotosi', 'Campeche', 'Colima', 'Manzanillo',
  'Taxco', 'Zihuatanejo', 'Tulum', 'Valladolid', 'Progreso',
  'IslaMujeres', 'Cozumel', 'BahiaDeBanderas', 'RivieraMaya',
  'RivieraNayarit', 'Sayulita', 'PuntaMita', 'Huatulco',
  'PuertoEscondido', 'Xalapa', 'Coatzacoalcos', 'Orizaba',
  'Cordoba', 'Poza_Rica', 'Minatitlan', 'Papantla',
  'CiudadVictoria', 'Monclova', 'Piedras_Negras', 'Delicias',
  'CiudadObregon', 'Navojoa', 'Guaymas', 'LosMochis',
  'LasPazBCS', 'Loreto', 'Tecate', 'Rosarito', 'SanQuintin',
  'SanFelipeBaja', 'Mulege', 'GuerreroNegro', 'Comitan',
  'Tapachula', 'Palenque', 'Tonala', 'Chiapa_de_Corzo',
  'Villahermosa', 'Comalcalco', 'Cardenas_Tabasco',
  'CiudadDelCarmen', 'Champoton', 'Calakmul', 'Bacalar',
  'FelipeCarrilloP', 'Tizimin', 'Izamal', 'Uxmal',
  'Tlaxcala', 'Apizaco', 'Huamantla', 'Cholula',
  'Atlixco', 'Tehuacan', 'SanAndresCholula', 'SanPedroGarza',
  'SanNicolas', 'Apodaca', 'Escobedo', 'Guadalupe_NL',
  'SantaCatarina_NL', 'Cumbres', 'MonterreyTec',
  'Zapopan', 'Tlaquepaque', 'Tonala_Jalisco', 'PuertoVallartaMX',
  'Chapala', 'Ajijic', 'Tequila', 'Lagos_de_Moreno',
  'Tepatitlan', 'Ocotlan', 'CiudadGuzman',
  'Uruapan', 'Zamora', 'Lazaro_Cardenas', 'Patzcuaro',
  'Sahuayo', 'Apatzingan', 'Zitacuaro', 'Hidalgo_Michoacan',
  'Jiutepec', 'Temixco', 'Cuautla', 'Yautepec',
  'Jojutla', 'Tepoztlan',
  'Naucalpan', 'Tlalnepantla', 'Ecatepec', 'Nezahualcoyotl',
  'Texcoco', 'Chalco', 'Ixtapaluca', 'Coacalco',
  'Atizapan', 'Cuautitlan', 'Metepec', 'Zinacantepec',
  'Lerma', 'SanMateoAtenco',
  'Fresnillo', 'Jerez', 'Sombrerete', 'Nochistlan',
  'Tepic_Nayarit', 'Compostela', 'SanBlas',
  'Chilpancingo', 'Iguala', 'Zihuatanejo_Guerrero',
  // Additional searches
  'mexico', 'MexicoCity', 'CDMX', 'EstadoDeMexico', 'EdoMex',
  'Guadalajara', 'Monterrey', 'Tijuana', 'Cancun',
  'PueblaCity', 'Queretaro_MX', 'SLP', 'Merida_Mexico',
  'Chiapas_Mexico', 'BajaCalifornia', 'BajaCaliforniaSur',
  'Sonora_Mexico', 'Sinaloa_Mexico', 'Jalisco_Mexico',
  'NuevoLeon', 'Tamaulipas_Mexico', 'Coahuila_Mexico',
  'Tabasco_Mexico', 'Yucatan_Mexico', 'QuintanaRoo',
  'Guerrero_Mexico', 'Michoacan_Mexico', 'Veracruz_Mexico',
  'Hidalgo_Mexico', 'Morelos_Mexico', 'Tlaxcala_Mexico',
  'Puebla_Mexico', 'Oaxaca_Mexico', 'Chihuahua_Mexico',
  'Durango_Mexico', 'Zacatecas_Mexico', 'Aguascalientes_Mexico',
  'Nayarit_Mexico', 'Colima_Mexico', 'Guanajuato_Mexico',
  'SanLuisPotosi_Mexico', 'Campeche_Mexico',
  // More city-specific
  'Queretaro', 'LeonGTO', 'LeonMexico', 'IrapuatoGTO',
  'CelayaGTO', 'SalamancaGTO', 'SilaoGTO',
  'PuertoPenasco', 'RockyPoint', 'SanCarlosSonora',
  'Alamos', 'Caborca', 'Agua_Prieta',
  'Juarez', 'CiuadadJuarez', 'Parral', 'Cuauhtemoc_Chih',
  'NuevoCasasGrandes', 'Creel',
  'Torreon_Coahuila', 'Monclova_Coahuila', 'Sabinas',
  'MuzquizCoahuila', 'Acuna',
  'Reynosa_Tamaulipas', 'Matamoros_Tam', 'NuevoLaredo_Tam',
  'Tampico_Tam', 'CiudadMante', 'CiudadMadero',
  'Linares', 'Montemorelos', 'Cadereyta',
  'Tepic_MX', 'SanBlas_Nayarit', 'Compostela_Nayarit',
  'Manzanillo_Col', 'Tecoman', 'Armeria',
  'Mazatlan_Sin', 'LosMochis_Sin', 'Guasave', 'Navolato',
  'ElFuerte', 'Concordia',
  'Acapulco_Guerrero', 'Taxco_Guerrero', 'Chilapa',
  'Tlapa', 'Petatlan',
  'Uruapan_Mich', 'Zamora_Mich', 'Patzcuaro_Mich',
  'Lazaro_Cardenas_Mich', 'Sahuayo_Mich',
  'Xalapa_Ver', 'Coatzacoalcos_Ver', 'Orizaba_Ver',
  'Cordoba_Ver', 'PozaRica', 'Minatitlan_Ver',
  'Tuxpan', 'Boca_del_Rio', 'Papantla_Ver',
  'Tapachula_Chis', 'Comitan_Chis', 'SanCristobal',
  'Palenque_Chis', 'Tonala_Chis', 'Ocosingo',
  'Tehuacan_Pue', 'Cholula_Pue', 'Atlixco_Pue',
  'SanAndresCholula_Pue', 'Izucar',
  'Pachuca_Hgo', 'Tulancingo', 'Tula_Hidalgo',
  'Actopan_Hgo', 'Ixmiquilpan',
  'Cuautla_Mor', 'Tepoztlan_Mor', 'Jiutepec_Mor',
  'Jojutla_Mor', 'Yautepec_Mor',
  'Apizaco_Tlax', 'Huamantla_Tlax',
  'Toluca_EdoMex', 'Metepec_EdoMex', 'Naucalpan_EdoMex',
  'Ecatepec_EdoMex', 'Texcoco_EdoMex',
  'Fresnillo_Zac', 'Jerez_Zac',
  'Bacalar_QR', 'Tulum_QR', 'PlayaDelCarmen_QR',
  'IslaMujeres_QR', 'Cozumel_QR', 'Holbox',
  'Izamal_Yuc', 'Tizimin_Yuc', 'Valladolid_Yuc', 'Progreso_Yuc',
  'CiudadDelCarmen_Camp',
  'Villahermosa_Tab', 'Comalcalco_Tab',
  // More common Reddit names
  'CDMX', 'mty', 'gdl', 'tjx', 'qro',
  'slp', 'pue', 'ver', 'oax', 'chis',
  'Acapulco', 'PuertoVallarta', 'Mazatlan',
  'Ensenada', 'Rosarito', 'Tecate',
  'PlayaDelCarmen', 'Tulum', 'Cancun',
  'Cozumel', 'IslaMujeres', 'Bacalar', 'Holbox',
  'SanMiguelDeAllende', 'Guanajuato',
  'Oaxaca', 'PuertoEscondido', 'Huatulco',
  'SanCristobalDeLasCasas', 'Palenque',
  'LosCabos', 'CaboSanLucas', 'LaPazBCS', 'Loreto',
  'Zacatecas', 'Durango', 'Chihuahua',
  'Torreon', 'Saltillo', 'Tampico',
  'Reynosa', 'Matamoros', 'NuevoLaredo',
  'CiudadJuarez', 'Nogales',
  'Veracruz', 'Xalapa', 'Puebla',
  'Queretaro', 'Leon', 'Celaya', 'Irapuato',
  'Cuernavaca', 'Pachuca', 'Tlaxcala',
  'Tepic', 'Colima', 'Manzanillo',
  'Campeche', 'Merida', 'Villahermosa',
  'CiudadVictoria', 'Tuxtla',
  'Morelia', 'Uruapan', 'Patzcuaro',
  'Toluca', 'Mexicali', 'Hermosillo',
  'Culiacan', 'LosMochis', 'Guaymas',
  'CiudadObregon', 'Navojoa',
  'SanLuisPotosi', 'Aguascalientes',
  'Taxco', 'Zihuatanejo', 'Iguala',
  'Coatzacoalcos', 'Orizaba', 'Cordoba',
  'Tapachula', 'Comitan',
  'Tehuacan', 'Cholula',
  'Tulancingo', 'Tula',
  'Cuautla', 'Tepoztlan',
  'Fresnillo', 'Jerez',
  'RivieraMaya', 'RivieraNayarit',
  'Sayulita', 'Chapala', 'Ajijic',
  'Tequila', 'Tonala',
  'SanPedroGarzaGarcia', 'NuevoLeon',
  'Zapopan', 'Tlaquepaque',
  'Monclova', 'PiedrasNegras', 'Acuna',
  'Delicias', 'Parral', 'Cuauhtemoc',
  'PuertoPenasco', 'RockyPoint',
  'Linares', 'CiudadMadero', 'CiudadMante',
  'Guasave', 'Navolato',
  'Tecoman', 'Tepatitlan', 'Ocotlan',
  'Zamora', 'Apatzingan', 'Sahuayo',
  'Chilpancingo', 'Chilapa',
  'Tuxpan', 'BocaDelRio', 'PozaRica',
  'Ocosingo',
  'Izucar', 'Atlixco',
  'Actopan', 'Ixmiquilpan',
  'Jiutepec', 'Jojutla',
  'Apizaco', 'Huamantla',
  'Metepec', 'Naucalpan', 'Ecatepec', 'Texcoco',
  'Nezahualcoyotl', 'Chalco',
  'Sombrerete', 'Nochistlan',
  'Valladolid', 'Progreso', 'Tizimin', 'Izamal',
  'CiudadDelCarmen', 'Champoton',
  'Comalcalco',
  'SanBlas', 'Compostela',
  'Concordia', 'ElFuerte',
  'Alamos', 'Caborca', 'AguaPrieta',
  'NuevoCasasGrandes', 'Creel',
  'Sabinas', 'Muzquiz',
  'Cadereyta', 'Montemorelos',
];

// Deduplicate
const unique = [...new Set(candidates)];

async function checkSubreddit(name) {
  return new Promise((resolve) => {
    const url = `https://www.reddit.com/r/${name}/about.json`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'SubredditChecker/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.subscribers !== undefined) {
            resolve({
              name: json.data.display_name,
              subscribers: json.data.subscribers,
              title: json.data.title,
              exists: true
            });
          } else {
            resolve({ name, exists: false });
          }
        } catch {
          resolve({ name, exists: false });
        }
      });
    });
    req.on('error', () => resolve({ name, exists: false }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ name, exists: false }); });
  });
}

async function main() {
  const results = [];
  // Process in batches of 5 with delay
  for (let i = 0; i < unique.length; i += 3) {
    const batch = unique.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map(checkSubreddit));
    for (const r of batchResults) {
      if (r.exists && r.subscribers > 10) {
        results.push(r);
        process.stdout.write(`✓ r/${r.name} (${r.subscribers} subs) - ${r.title}\n`);
      }
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1200));
  }
  
  console.log(`\n\nTotal found: ${results.length}`);
  console.log(JSON.stringify(results, null, 2));
}

main();
