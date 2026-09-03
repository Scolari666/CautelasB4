export interface InfracaoOption {
  code: string;
  letra: string;
  texto: string;
}

export interface InfracaoGrupo {
  nivel: "LEVE" | "MEDIA" | "GRAVE";
  titulo: string;
  itens: InfracaoOption[];
}

// Anexo A — Art. 18, Decreto Estadual n.º 51.803, de 10 de setembro de 2014.
export const ANEXO_A_INFRACOES: InfracaoGrupo[] = [
  {
    nivel: "LEVE",
    titulo: "Infrações leves — Art. 18, inciso I do Decreto Estadual n.º 51.803/2014",
    itens: [
      {
        code: "LEVE_A",
        letra: "a",
        texto:
          "deixar de cumprir os prazos assinalados na notificação de correção de análise ou comunicação de inconformidade na análise;",
      },
      {
        code: "LEVE_B",
        letra: "b",
        texto:
          "deixar de cumprir os prazos assinalados na notificação de correção de vistoria ou comunicação de inconformidade na vistoria;",
      },
    ],
  },
  {
    nivel: "MEDIA",
    titulo: "Infrações médias — Art. 18, inciso II do Decreto Estadual n.º 51.803/2014",
    itens: [
      {
        code: "MEDIA_A",
        letra: "a",
        texto:
          "deixar de cumprir os prazos regulamentares para a solicitação de renovação do licenciamento em segurança contra incêndio ou atualização do processo, quando exigido, de edificação, de área de risco de incêndio, de construção provisória, de evento temporário ou de espetáculo pirotécnico;",
      },
      {
        code: "MEDIA_B",
        letra: "b",
        texto:
          "deixar de protocolar processo para licenciamento em segurança contra incêndio de edificação, área de risco de incêndio ou de construção provisória, antes do início de sua construção;",
      },
      {
        code: "MEDIA_C",
        letra: "c",
        texto:
          "deixar de protocolar processo para novo licenciamento em segurança contra incêndio de edificação, de área de risco de incêndio ou de construção provisória, quando houver alteração que implique na apresentação de novo processo conforme o art. 7º da Lei Complementar n.º 14.376/2013 e RTCBMRS;",
      },
      {
        code: "MEDIA_D",
        letra: "d",
        texto:
          "deixar de protocolar processo para licenciamento em segurança contra incêndio de edificação, de área de risco de incêndio ou de construção provisória, quando obrigatória a adaptação de edificação existente pela Lei Complementar n.º 14.376/2013;",
      },
      {
        code: "MEDIA_E",
        letra: "e",
        texto:
          "deixar de manter na edificação, na área de risco de incêndio, na construção provisória, no evento temporário ou no espetáculo pirotécnico a documentação exigida pela legislação e pela regulamentação em segurança contra incêndio;",
      },
      {
        code: "MEDIA_F",
        letra: "f",
        texto:
          "deixar de afixar em local visível ao público o APPCI e/ou a placa com a lotação máxima junto à porta principal do acesso ou dos recintos regulamentados e/ou deixar de instalar ou instalar de forma incorreta ou inoperante um ou mais dos dispositivos eletrônicos para a contagem da população junto aos acessos de público da edificação, da área de risco de incêndio, da construção provisória, do evento temporário ou do espetáculo pirotécnico, quando exigidos;",
      },
      {
        code: "MEDIA_G",
        letra: "g",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória, o evento temporário ou o espetáculo pirotécnico, com uma ou mais das medidas de segurança contra incêndio aprovadas no licenciamento em segurança contra incêndio inoperantes, com acesso dificultado ou obstruído, total ou parcialmente;",
      },
      {
        code: "MEDIA_H",
        letra: "h",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória enquadrada no art. 4º, § 2º, da Lei Complementar n.º 14.376/2013 com uma ou mais medidas de segurança contra incêndio obrigatórias instaladas de forma deficiente ou inoperante;",
      },
      {
        code: "MEDIA_I",
        letra: "i",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória com uma ou mais das medidas de segurança obrigatórias instaladas de forma deficiente, após a concessão de licença/autorização precária ou provisória válida de que trata o art. 5º, § 2º, da Lei Complementar n.º 14.376/2013;",
      },
      {
        code: "MEDIA_J",
        letra: "j",
        texto: "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória, com APPCI vencido;",
      },
    ],
  },
  {
    nivel: "GRAVE",
    titulo: "Infrações graves — Art. 18, inciso III do Decreto Estadual n.º 51.803/2014",
    itens: [
      {
        code: "GRAVE_A",
        letra: "a",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória, sem APPCI ou fora do enquadramento de dispensa de licenciamento em segurança contra incêndio, exceto quando esteja gozando de prazos de adaptação à Lei Complementar n.º 14.376/2013 ou funcionando com licença precária/provisória válida emitida de acordo com o art. 5º, § 2º, da Lei Complementar n.º 14.376/2013;",
      },
      {
        code: "GRAVE_B",
        letra: "b",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória enquadrada no art. 4º, § 2º, da Lei Complementar n.º 14.376/2013 sem que as medidas de segurança contra incêndio obrigatórias tenham sido instaladas;",
      },
      {
        code: "GRAVE_C",
        letra: "c",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio ou a construção provisória sem que as medidas de segurança obrigatórias tenham sido instaladas, após a concessão de licença/autorização precária ou provisória válida que trata o art. 5º, § 2º, da Lei Complementar n.º 14.376/2013;",
      },
      {
        code: "GRAVE_D",
        letra: "d",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio, a construção provisória, o evento temporário ou o espetáculo pirotécnico, sem uma ou mais das medidas de segurança aprovadas no licenciamento em segurança contra incêndio;",
      },
      {
        code: "GRAVE_E",
        letra: "e",
        texto:
          "alterar uma ou mais das medidas de segurança contra incêndio aprovadas no licenciamento em segurança contra incêndio da edificação, da área de risco de incêndio, da construção provisória, do evento temporário ou espetáculo pirotécnico;",
      },
      {
        code: "GRAVE_F",
        letra: "f",
        texto:
          "manter em funcionamento a edificação, a área de risco de incêndio, a construção provisória, o evento temporário ou o espetáculo pirotécnico com a instalação de barreira, cadeado ou qualquer dispositivo que impeça ou dificulte a utilização das saídas de emergência;",
      },
      {
        code: "GRAVE_G",
        letra: "g",
        texto: "utilizar materiais, equipamentos e sistemas construtivos divergentes dos constantes no PrPCI;",
      },
      {
        code: "GRAVE_H",
        letra: "h",
        texto:
          "permitir a entrada de pessoas em número superior à capacidade de lotação aprovada no licenciamento em segurança contra incêndio;",
      },
      {
        code: "GRAVE_I",
        letra: "i",
        texto: "realizar evento temporário e/ou espetáculo pirotécnico sem licenciamento válido;",
      },
      {
        code: "GRAVE_J",
        letra: "j",
        texto: "prestar informação falsa ou omitir informação para a obtenção indevida do licenciamento em segurança contra incêndio;",
      },
      {
        code: "GRAVE_K",
        letra: "k",
        texto: "descumprir os prazos ou as exigências constantes no auto de imposição da penalidade de advertência;",
      },
      { code: "GRAVE_L", letra: "l", texto: "descumprir o auto de interdição;" },
      { code: "GRAVE_M", letra: "m", texto: "omitir uma ou mais medidas de segurança contra incêndio no PrPCI;" },
      {
        code: "GRAVE_N",
        letra: "n",
        texto: "fazer constar no PrPCI uma ou mais medidas de segurança contra incêndio projetadas de forma divergente do PPCI aprovado;",
      },
      {
        code: "GRAVE_O",
        letra: "o",
        texto:
          "deixar de instalar ou de manter em perfeitas condições de funcionamento o desfibrilador automático, conforme art. 32 deste Decreto.",
      },
      {
        code: "GRAVE_P",
        letra: "p",
        texto:
          "manter em funcionamento edificação ou área de risco de incêndio sem que as medidas de segurança contra incêndio obrigatórias, previstas no art. 7º, § 1º, inciso I, deste Decreto, tenham sido instaladas ou a instalação tenha sido realizada de forma deficiente ou inoperante;",
      },
      {
        code: "GRAVE_Q",
        letra: "q",
        texto:
          "manter em funcionamento edificação ou área de risco de incêndio sem que as medidas de segurança contra incêndio obrigatórias, previstas no inciso II do art. 35-D deste Decreto, tenham sido instaladas ou a instalação tenha sido realizada de forma deficiente ou inoperante.",
      },
    ],
  },
];

export const NIVEL_LABEL: Record<InfracaoGrupo["nivel"], string> = {
  LEVE: "Leve",
  MEDIA: "Média",
  GRAVE: "Grave",
};

export const NIVEL_BADGE_CLASS: Record<InfracaoGrupo["nivel"], string> = {
  LEVE: "bg-amber-100 text-amber-800",
  MEDIA: "bg-orange-100 text-orange-800",
  GRAVE: "bg-red-100 text-red-800",
};
