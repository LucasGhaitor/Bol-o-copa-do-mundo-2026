// js/partidas-data.js
// Horários em Brasília

const jogos = [
  [1, "Fase de Grupos", "Grupo A", "11/06/2026", "16:00", "Estádio Azteca", "Cidade do México", "México", "África do Sul", "MEX", "RSA"],
  [2, "Fase de Grupos", "Grupo A", "11/06/2026", "23:00", "Estádio Akron", "Zapopan", "Coreia do Sul", "Tchéquia", "KOR", "CZE"],

  [3, "Fase de Grupos", "Grupo B", "12/06/2026", "16:00", "BMO Field", "Toronto", "Canadá", "Bósnia e Herzegovina", "CAN", "BIH"],
  [4, "Fase de Grupos", "Grupo D", "12/06/2026", "22:00", "SoFi Stadium", "Inglewood", "Estados Unidos", "Paraguai", "USA", "PAR"],

  [5, "Fase de Grupos", "Grupo B", "13/06/2026", "16:00", "Levi's Stadium", "Santa Clara", "Catar", "Suíça", "QAT", "SUI"],
  [6, "Fase de Grupos", "Grupo C", "13/06/2026", "19:00", "Gillette Stadium", "Foxborough", "Brasil", "Marrocos", "BRA", "MAR"],
  [7, "Fase de Grupos", "Grupo C", "13/06/2026", "22:00", "MetLife Stadium", "East Rutherford", "Haiti", "Escócia", "HAI", "SCO"],

  [8, "Fase de Grupos", "Grupo D", "14/06/2026", "01:00", "BC Place", "Vancouver", "Austrália", "Turquia", "AUS", "TUR"],
  [9, "Fase de Grupos", "Grupo E", "14/06/2026", "14:00", "NRG Stadium", "Houston", "Alemanha", "Curaçao", "GER", "CUW"],
  [10, "Fase de Grupos", "Grupo F", "14/06/2026", "17:00", "AT&T Stadium", "Arlington", "Holanda", "Japão", "NED", "JPN"],
  [11, "Fase de Grupos", "Grupo E", "14/06/2026", "20:00", "Lincoln Financial Field", "Filadélfia", "Costa do Marfim", "Equador", "CIV", "ECU"],
  [12, "Fase de Grupos", "Grupo F", "14/06/2026", "23:00", "Estádio BBVA", "Guadalupe", "Suécia", "Tunísia", "SWE", "TUN"],

  [13, "Fase de Grupos", "Grupo H", "15/06/2026", "13:00", "Mercedes-Benz Stadium", "Atlanta", "Espanha", "Cabo Verde", "ESP", "CPV"],
  [14, "Fase de Grupos", "Grupo G", "15/06/2026", "16:00", "Lumen Field", "Seattle", "Bélgica", "Egito", "BEL", "EGY"],
  [15, "Fase de Grupos", "Grupo H", "15/06/2026", "19:00", "Hard Rock Stadium", "Miami Gardens", "Arábia Saudita", "Uruguai", "KSA", "URU"],
  [16, "Fase de Grupos", "Grupo G", "15/06/2026", "22:00", "SoFi Stadium", "Inglewood", "Irã", "Nova Zelândia", "IRN", "NZL"],

  [17, "Fase de Grupos", "Grupo I", "16/06/2026", "16:00", "MetLife Stadium", "East Rutherford", "França", "Senegal", "FRA", "SEN"],
  [18, "Fase de Grupos", "Grupo I", "16/06/2026", "19:00", "Gillette Stadium", "Foxborough", "Iraque", "Noruega", "IRQ", "NOR"],
  [19, "Fase de Grupos", "Grupo J", "16/06/2026", "22:00", "Arrowhead Stadium", "Kansas City", "Argentina", "Argélia", "ARG", "ALG"],

  [20, "Fase de Grupos", "Grupo J", "17/06/2026", "01:00", "Levi's Stadium", "Santa Clara", "Áustria", "Jordânia", "AUT", "JOR"],
  [21, "Fase de Grupos", "Grupo K", "17/06/2026", "14:00", "NRG Stadium", "Houston", "Portugal", "RD Congo", "POR", "COD"],
  [22, "Fase de Grupos", "Grupo L", "17/06/2026", "17:00", "AT&T Stadium", "Arlington", "Inglaterra", "Croácia", "ENG", "CRO"],
  [23, "Fase de Grupos", "Grupo L", "17/06/2026", "20:00", "BMO Field", "Toronto", "Gana", "Panamá", "GHA", "PAN"],
  [24, "Fase de Grupos", "Grupo K", "17/06/2026", "23:00", "Estádio Azteca", "Cidade do México", "Uzbequistão", "Colômbia", "UZB", "COL"],

  [25, "Fase de Grupos", "Grupo A", "18/06/2026", "13:00", "Mercedes-Benz Stadium", "Atlanta", "Tchéquia", "África do Sul", "CZE", "RSA"],
  [26, "Fase de Grupos", "Grupo B", "18/06/2026", "16:00", "SoFi Stadium", "Inglewood", "Suíça", "Bósnia e Herzegovina", "SUI", "BIH"],
  [27, "Fase de Grupos", "Grupo B", "18/06/2026", "19:00", "BC Place", "Vancouver", "Canadá", "Catar", "CAN", "QAT"],
  [28, "Fase de Grupos", "Grupo A", "18/06/2026", "22:00", "Estádio Akron", "Zapopan", "México", "Coreia do Sul", "MEX", "KOR"],

  [29, "Fase de Grupos", "Grupo D", "19/06/2026", "16:00", "Lumen Field", "Seattle", "Estados Unidos", "Austrália", "USA", "AUS"],
  [30, "Fase de Grupos", "Grupo C", "19/06/2026", "19:00", "Lincoln Financial Field", "Filadélfia", "Escócia", "Marrocos", "SCO", "MAR"],
  [31, "Fase de Grupos", "Grupo C", "19/06/2026", "21:30", "Gillette Stadium", "Foxborough", "Brasil", "Haiti", "BRA", "HAI"],

  [32, "Fase de Grupos", "Grupo D", "20/06/2026", "00:00", "Levi's Stadium", "Santa Clara", "Turquia", "Paraguai", "TUR", "PAR"],
  [33, "Fase de Grupos", "Grupo F", "20/06/2026", "14:00", "NRG Stadium", "Houston", "Holanda", "Suécia", "NED", "SWE"],
  [34, "Fase de Grupos", "Grupo E", "20/06/2026", "17:00", "BMO Field", "Toronto", "Alemanha", "Costa do Marfim", "GER", "CIV"],
  [35, "Fase de Grupos", "Grupo E", "20/06/2026", "21:00", "Arrowhead Stadium", "Kansas City", "Equador", "Curaçao", "ECU", "CUW"],

  [36, "Fase de Grupos", "Grupo F", "21/06/2026", "01:00", "Estádio BBVA", "Guadalupe", "Tunísia", "Japão", "TUN", "JPN"],
  [37, "Fase de Grupos", "Grupo H", "21/06/2026", "13:00", "Mercedes-Benz Stadium", "Atlanta", "Espanha", "Arábia Saudita", "ESP", "KSA"],
  [38, "Fase de Grupos", "Grupo G", "21/06/2026", "16:00", "SoFi Stadium", "Inglewood", "Bélgica", "Irã", "BEL", "IRN"],
  [39, "Fase de Grupos", "Grupo H", "21/06/2026", "19:00", "Hard Rock Stadium", "Miami Gardens", "Uruguai", "Cabo Verde", "URU", "CPV"],
  [40, "Fase de Grupos", "Grupo G", "21/06/2026", "22:00", "BC Place", "Vancouver", "Nova Zelândia", "Egito", "NZL", "EGY"],

  [41, "Fase de Grupos", "Grupo J", "22/06/2026", "14:00", "AT&T Stadium", "Arlington", "Argentina", "Áustria", "ARG", "AUT"],
  [42, "Fase de Grupos", "Grupo I", "22/06/2026", "18:00", "Lincoln Financial Field", "Filadélfia", "França", "Iraque", "FRA", "IRQ"],
  [43, "Fase de Grupos", "Grupo I", "22/06/2026", "21:00", "MetLife Stadium", "East Rutherford", "Noruega", "Senegal", "NOR", "SEN"],

  [44, "Fase de Grupos", "Grupo J", "23/06/2026", "00:00", "Levi's Stadium", "Santa Clara", "Jordânia", "Argélia", "JOR", "ALG"],
  [45, "Fase de Grupos", "Grupo K", "23/06/2026", "14:00", "NRG Stadium", "Houston", "Portugal", "Uzbequistão", "POR", "UZB"],
  [46, "Fase de Grupos", "Grupo L", "23/06/2026", "17:00", "Gillette Stadium", "Foxborough", "Inglaterra", "Gana", "ENG", "GHA"],
  [47, "Fase de Grupos", "Grupo L", "23/06/2026", "20:00", "BMO Field", "Toronto", "Panamá", "Croácia", "PAN", "CRO"],
  [48, "Fase de Grupos", "Grupo K", "23/06/2026", "23:00", "Estádio Akron", "Zapopan", "Colômbia", "RD Congo", "COL", "COD"],

  [49, "Fase de Grupos", "Grupo B", "24/06/2026", "16:00", "BC Place", "Vancouver", "Suíça", "Canadá", "SUI", "CAN"],
  [50, "Fase de Grupos", "Grupo B", "24/06/2026", "16:00", "Lumen Field", "Seattle", "Bósnia e Herzegovina", "Catar", "BIH", "QAT"],
  [51, "Fase de Grupos", "Grupo C", "24/06/2026", "19:00", "Mercedes-Benz Stadium", "Atlanta", "Marrocos", "Haiti", "MAR", "HAI"],
  [52, "Fase de Grupos", "Grupo C", "24/06/2026", "19:00", "Hard Rock Stadium", "Miami Gardens", "Escócia", "Brasil", "SCO", "BRA"],
  [53, "Fase de Grupos", "Grupo A", "24/06/2026", "22:00", "Estádio BBVA", "Guadalupe", "África do Sul", "Coreia do Sul", "RSA", "KOR"],
  [54, "Fase de Grupos", "Grupo A", "24/06/2026", "22:00", "Estádio Azteca", "Cidade do México", "Tchéquia", "México", "CZE", "MEX"],

  [55, "Fase de Grupos", "Grupo E", "25/06/2026", "17:00", "Lincoln Financial Field", "Filadélfia", "Curaçao", "Costa do Marfim", "CUW", "CIV"],
  [56, "Fase de Grupos", "Grupo E", "25/06/2026", "17:00", "MetLife Stadium", "East Rutherford", "Equador", "Alemanha", "ECU", "GER"],
  [57, "Fase de Grupos", "Grupo F", "25/06/2026", "20:00", "Arrowhead Stadium", "Kansas City", "Tunísia", "Holanda", "TUN", "NED"],
  [58, "Fase de Grupos", "Grupo F", "25/06/2026", "20:00", "AT&T Stadium", "Arlington", "Japão", "Suécia", "JPN", "SWE"],
  [59, "Fase de Grupos", "Grupo D", "25/06/2026", "23:00", "SoFi Stadium", "Inglewood", "Turquia", "Estados Unidos", "TUR", "USA"],
  [60, "Fase de Grupos", "Grupo D", "25/06/2026", "23:00", "Levi's Stadium", "Santa Clara", "Paraguai", "Austrália", "PAR", "AUS"],

  [61, "Fase de Grupos", "Grupo I", "26/06/2026", "16:00", "Gillette Stadium", "Foxborough", "Noruega", "França", "NOR", "FRA"],
  [62, "Fase de Grupos", "Grupo I", "26/06/2026", "16:00", "BMO Field", "Toronto", "Senegal", "Iraque", "SEN", "IRQ"],
  [63, "Fase de Grupos", "Grupo H", "26/06/2026", "21:00", "NRG Stadium", "Houston", "Cabo Verde", "Arábia Saudita", "CPV", "KSA"],
  [64, "Fase de Grupos", "Grupo H", "26/06/2026", "21:00", "Estádio Akron", "Zapopan", "Uruguai", "Espanha", "URU", "ESP"],

  [65, "Fase de Grupos", "Grupo G", "27/06/2026", "00:00", "BC Place", "Vancouver", "Nova Zelândia", "Bélgica", "NZL", "BEL"],
  [66, "Fase de Grupos", "Grupo G", "27/06/2026", "00:00", "Lumen Field", "Seattle", "Egito", "Irã", "EGY", "IRN"],
  [67, "Fase de Grupos", "Grupo L", "27/06/2026", "18:00", "MetLife Stadium", "East Rutherford", "Panamá", "Inglaterra", "PAN", "ENG"],
  [68, "Fase de Grupos", "Grupo L", "27/06/2026", "18:00", "Lincoln Financial Field", "Filadélfia", "Croácia", "Gana", "CRO", "GHA"],
  [69, "Fase de Grupos", "Grupo K", "27/06/2026", "20:30", "Hard Rock Stadium", "Miami Gardens", "Colômbia", "Portugal", "COL", "POR"],
  [70, "Fase de Grupos", "Grupo K", "27/06/2026", "20:30", "Mercedes-Benz Stadium", "Atlanta", "RD Congo", "Uzbequistão", "COD", "UZB"],
  [71, "Fase de Grupos", "Grupo J", "27/06/2026", "23:00", "Arrowhead Stadium", "Kansas City", "Argélia", "Áustria", "ALG", "AUT"],
  [72, "Fase de Grupos", "Grupo J", "27/06/2026", "23:00", "AT&T Stadium", "Arlington", "Jordânia", "Argentina", "JOR", "ARG"],

  [73, "Mata-mata", "32 avos - Jogo 73", "28/06/2026", "16:00", "SoFi Stadium", "Inglewood", "2º Grupo A", "2º Grupo B", "TBD", "TBD"],
  [74, "Mata-mata", "32 avos - Jogo 74", "29/06/2026", "17:30", "Gillette Stadium", "Foxborough", "1º Grupo E", "3º Grupo A/B/C/D/F", "TBD", "TBD"],
  [75, "Mata-mata", "32 avos - Jogo 75", "29/06/2026", "22:00", "Estádio BBVA", "Guadalupe", "1º Grupo F", "2º Grupo C", "TBD", "TBD"],
  [76, "Mata-mata", "32 avos - Jogo 76", "29/06/2026", "14:00", "NRG Stadium", "Houston", "1º Grupo C", "2º Grupo F", "TBD", "TBD"],
  [77, "Mata-mata", "32 avos - Jogo 77", "30/06/2026", "18:00", "MetLife Stadium", "East Rutherford", "1º Grupo I", "3º Grupo C/D/F/G/H", "TBD", "TBD"],
  [78, "Mata-mata", "32 avos - Jogo 78", "30/06/2026", "14:00", "AT&T Stadium", "Arlington", "2º Grupo E", "2º Grupo I", "TBD", "TBD"],
  [79, "Mata-mata", "32 avos - Jogo 79", "30/06/2026", "22:00", "Estádio Azteca", "Cidade do México", "1º Grupo A", "3º Grupo C/E/F/H/I", "TBD", "TBD"],
  [80, "Mata-mata", "32 avos - Jogo 80", "01/07/2026", "13:00", "Mercedes-Benz Stadium", "Atlanta", "1º Grupo L", "3º Grupo E/H/I/J/K", "TBD", "TBD"],
  [81, "Mata-mata", "32 avos - Jogo 81", "01/07/2026", "21:00", "Levi's Stadium", "Santa Clara", "1º Grupo D", "3º Grupo B/E/F/I/J", "TBD", "TBD"],
  [82, "Mata-mata", "32 avos - Jogo 82", "01/07/2026", "17:00", "Lumen Field", "Seattle", "1º Grupo G", "3º Grupo A/E/H/I/J", "TBD", "TBD"],
  [83, "Mata-mata", "32 avos - Jogo 83", "02/07/2026", "20:00", "BMO Field", "Toronto", "2º Grupo K", "2º Grupo L", "TBD", "TBD"],
  [84, "Mata-mata", "32 avos - Jogo 84", "02/07/2026", "16:00", "SoFi Stadium", "Inglewood", "1º Grupo H", "2º Grupo J", "TBD", "TBD"],
  [85, "Mata-mata", "32 avos - Jogo 85", "03/07/2026", "00:00", "BC Place", "Vancouver", "1º Grupo B", "3º Grupo E/F/G/I/J", "TBD", "TBD"],
  [86, "Mata-mata", "32 avos - Jogo 86", "03/07/2026", "19:00", "Hard Rock Stadium", "Miami Gardens", "1º Grupo J", "2º Grupo H", "TBD", "TBD"],
  [87, "Mata-mata", "32 avos - Jogo 87", "03/07/2026", "22:30", "Arrowhead Stadium", "Kansas City", "1º Grupo K", "3º Grupo D/E/I/J/L", "TBD", "TBD"],
  [88, "Mata-mata", "32 avos - Jogo 88", "03/07/2026", "15:00", "AT&T Stadium", "Arlington", "2º Grupo D", "2º Grupo G", "TBD", "TBD"],

  [89, "Mata-mata", "Oitavas - Jogo 89", "04/07/2026", "18:00", "Lincoln Financial Field", "Filadélfia", "Vencedor Jogo 74", "Vencedor Jogo 77", "TBD", "TBD"],
  [90, "Mata-mata", "Oitavas - Jogo 90", "04/07/2026", "14:00", "NRG Stadium", "Houston", "Vencedor Jogo 73", "Vencedor Jogo 75", "TBD", "TBD"],
  [91, "Mata-mata", "Oitavas - Jogo 91", "05/07/2026", "17:00", "MetLife Stadium", "East Rutherford", "Vencedor Jogo 76", "Vencedor Jogo 78", "TBD", "TBD"],
  [92, "Mata-mata", "Oitavas - Jogo 92", "05/07/2026", "21:00", "Estádio Azteca", "Cidade do México", "Vencedor Jogo 79", "Vencedor Jogo 80", "TBD", "TBD"],
  [93, "Mata-mata", "Oitavas - Jogo 93", "06/07/2026", "16:00", "AT&T Stadium", "Arlington", "Vencedor Jogo 83", "Vencedor Jogo 84", "TBD", "TBD"],
  [94, "Mata-mata", "Oitavas - Jogo 94", "06/07/2026", "21:00", "Lumen Field", "Seattle", "Vencedor Jogo 81", "Vencedor Jogo 82", "TBD", "TBD"],
  [95, "Mata-mata", "Oitavas - Jogo 95", "07/07/2026", "13:00", "Mercedes-Benz Stadium", "Atlanta", "Vencedor Jogo 86", "Vencedor Jogo 88", "TBD", "TBD"],
  [96, "Mata-mata", "Oitavas - Jogo 96", "07/07/2026", "17:00", "BC Place", "Vancouver", "Vencedor Jogo 85", "Vencedor Jogo 87", "TBD", "TBD"],

  [97, "Mata-mata", "Quartas - Jogo 97", "09/07/2026", "17:00", "Gillette Stadium", "Foxborough", "Vencedor Jogo 89", "Vencedor Jogo 90", "TBD", "TBD"],
  [98, "Mata-mata", "Quartas - Jogo 98", "10/07/2026", "16:00", "SoFi Stadium", "Inglewood", "Vencedor Jogo 93", "Vencedor Jogo 94", "TBD", "TBD"],
  [99, "Mata-mata", "Quartas - Jogo 99", "11/07/2026", "18:00", "Hard Rock Stadium", "Miami Gardens", "Vencedor Jogo 91", "Vencedor Jogo 92", "TBD", "TBD"],
  [100, "Mata-mata", "Quartas - Jogo 100", "11/07/2026", "22:00", "Arrowhead Stadium", "Kansas City", "Vencedor Jogo 95", "Vencedor Jogo 96", "TBD", "TBD"],

  [101, "Mata-mata", "Semifinal - Jogo 101", "14/07/2026", "16:00", "AT&T Stadium", "Arlington", "Vencedor Jogo 97", "Vencedor Jogo 98", "TBD", "TBD"],
  [102, "Mata-mata", "Semifinal - Jogo 102", "15/07/2026", "16:00", "Mercedes-Benz Stadium", "Atlanta", "Vencedor Jogo 99", "Vencedor Jogo 100", "TBD", "TBD"],

  [103, "Mata-mata", "Disputa de 3º Lugar - Jogo 103", "18/07/2026", "18:00", "Hard Rock Stadium", "Miami Gardens", "Perdedor Jogo 101", "Perdedor Jogo 102", "TBD", "TBD"],
  [104, "Mata-mata", "Final - Jogo 104", "19/07/2026", "16:00", "MetLife Stadium", "East Rutherford", "Vencedor Jogo 101", "Vencedor Jogo 102", "TBD", "TBD"]
];

export const partidas = jogos.map((jogo) => ({
  id: jogo[0],
  fase: jogo[1],
  grupo: jogo[2],
  data: jogo[3],
  hora: jogo[4],
  estadio: jogo[5],
  cidade: jogo[6],
  mandante: jogo[7],
  visitante: jogo[8],
  bandeiraMandante: jogo[9],
  bandeiraVisitante: jogo[10]
}));