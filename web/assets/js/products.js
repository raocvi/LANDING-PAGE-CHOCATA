/* =========================================================================
   CHOCATA — Fichas de producto
   Las afirmaciones de beneficio se redactan sobre el ingrediente y remiten
   siempre a la fuente primaria enlazada al final de cada ficha.
   ========================================================================= */
/* Recomendador por objetivo: cada meta apunta a las referencias que la
   trabajan, con la razón concreta (dosis o mecanismo), no un eslogan. */
window.CHOCATA_GOALS = {
  fuerza: [
    { p: "creatina",         w: "3 a 5 g diarios. Es el ergogénico con más respaldo para trabajo de alta intensidad y masa magra." },
    { p: "proteina",         w: "20 a 40 g por toma para cerrar el requerimiento proteico del día y sostener la síntesis muscular." },
    { p: "pre-workout",      w: "12 g media hora antes si la sesión es larga o de mucho volumen." }
  ],
  resistencia: [
    { p: "remolacha",        w: "Nitratos 2 a 3 horas antes: reducen el costo de oxígeno del ejercicio submáximo." },
    { p: "hidratec",         w: "Carbohidrato y electrolitos durante el esfuerzo, a sorbos, no solo al final." },
    { p: "chocata-premium",  w: "Carga de carbohidrato disponible antes de una salida larga." }
  ],
  energia: [
    { p: "chocata-premium",  w: "Malta y cacao endulzados con estevia: energía del desayuno con menos azúcar añadido." },
    { p: "latte-dorato",     w: "Bebida caliente sin cafeína, con cúrcuma, maca, canela y jengibre." },
    { p: "chocata-tradicional", w: "El chocolate de la mesa familiar, rinde 25 tazas." }
  ],
  defensas: [
    { p: "vitamina-c",       w: "Función inmune, síntesis de colágeno y mejor absorción del hierro no hemo. Tómala con comida." },
    { p: "chocata-granel",   w: "Vehículo de calcio, hierro, zinc y vitaminas A, C, D y del complejo B para toda la familia." }
  ],
  piel: [
    { p: "colageno",         w: "10 g diarios. Los metaanálisis miden mejoras de hidratación y elasticidad hacia los 90 días." },
    { p: "vitamina-c",       w: "El cuerpo la necesita para sintetizar su propio colágeno: van juntas." },
    { p: "magnesio",         w: "Cofactor de la síntesis proteica y de la función muscular normal." }
  ],
  descanso: [
    { p: "magnesio",         w: "Citrato, de alta biodisponibilidad. Reduce la excitabilidad nerviosa y acompaña la relajación muscular." },
    { p: "latte-dorato",     w: "Ritual caliente de la noche, sin cafeína." },
    { p: "colageno",         w: "Sin sabor: se disuelve en la misma bebida de la noche." }
  ]
};

window.CHOCATA_PRODUCTS = {

  "chocata-premium": {
    name: "CHOCATA Premium",
    kicker: "Bebida de malta y cacao",
    life: "assets/img/life/premium.webp",
    lifeAlt: "Pareja deportista disfrutando CHOCATA Premium frío al aire libre",
    facts: ["200 g", "10 porciones", "Con estevia", "Contiene edulcorantes · MinSalud"],
    description: "Alimento en polvo a base de malta para preparar bebida, endulzado con estevia. Es la versión ligera del chocolate de siempre: mismo cuerpo y mismo sabor a cacao, con menos azúcar añadido que la referencia tradicional. Se prepara frío o caliente y funciona igual de bien en licuadora con leche que a cucharaditas en un vaso de agua.",
    benefits: [
      { t: "Carbohidrato disponible", d: "La malta aporta carbohidratos de rápida disponibilidad, útiles como desayuno o como recarga antes o después de una sesión de ejercicio." },
      { t: "Vehículo de micronutrientes", d: "Las bebidas de malta fortificadas se usan como vehículo de calcio, hierro, zinc y vitaminas. Los metaanálisis en escolares muestran que las bebidas fortificadas con múltiples micronutrientes mejoran hemoglobina y ferritina sérica frente a controles isocalóricos." },
      { t: "Menos azúcar añadido", d: "El uso de estevia como edulcorante permite reducir el aporte de azúcar frente a la fórmula tradicional, manteniendo el dulzor esperado." },
      { t: "Adherencia real", d: "El mejor suplemento es el que se toma. Un sabor familiar hace que el hábito se sostenga en el tiempo, que es donde ocurren los resultados." }
    ],
    usage: "<strong>2 medidas (28 g) en licuadora con 200 ml</strong> de leche o agua; o <strong>5 cucharaditas</strong> directamente en el vaso. Frío o caliente. Una vez abierta, cierra bien la bolsa y consúmela en el menor tiempo posible para evitar que el producto se apelmace.",
    note: "Producto con sello frontal «Contiene edulcorantes» de acuerdo con la normativa colombiana de etiquetado.",
    sources: [
      { l: "Multiple-micronutrient fortified beverages reduce anemia and iron deficiency in school-aged children — meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4446783/" },
      { l: "Characteristics associated with consumption of malted drinks among primary school children — MyBreakfast study", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4697324/" }
    ]
  },

  "chocata-tradicional": {
    name: "CHOCATA Tradicional",
    kicker: "Chocolate granulado, sabor natural",
    life: "assets/img/life/desayuno.webp",
    lifeAlt: "Taza de chocolate CHOCATA caliente en la mesa del desayuno",
    facts: ["350 g", "Rinde 25 tazas", "Sabor chocolate natural", "Exceso en azúcares · MinSalud"],
    description: "El chocolate granulado de toda la vida: se disuelve rápido, no deja grumos y conserva el sabor a cacao natural que reconoce cualquier hogar colombiano. Pensado para la taza de la mañana, el algo de la tarde y la sobremesa. Es la referencia con la que nació la marca.",
    benefits: [
      { t: "Energía para arrancar", d: "Aporta carbohidratos que el cuerpo usa como combustible inmediato, ideal como parte de un desayuno completo antes del colegio, el trabajo o la ruta." },
      { t: "Disolución instantánea", d: "El formato granulado se integra en frío o caliente sin necesidad de licuadora ni molinillo." },
      { t: "Ritual compartido", d: "Rinde 25 porciones por bolsa, pensado para la mesa familiar y no para la porción individual." }
    ],
    usage: "Disuelve <strong>una porción en 200 ml</strong> de leche o agua caliente y revuelve. También funciona frío. Consérvalo en un lugar fresco y seco.",
    note: "Producto con sello frontal «Exceso en azúcares». Modera su consumo dentro de una alimentación equilibrada.",
    sources: [
      { l: "Fortified malt-based beverages and nutrient delivery in children — evidencia general", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4697324/" }
    ]
  },

  "chocata-granel": {
    name: "CHOCATA Granel 3,5 kg",
    kicker: "Formato institucional y repostería",
    life: "assets/img/life/reposteria.webp",
    lifeAlt: "Chef pastelero cubriendo una torta con chocolate CHOCATA",
    facts: ["3.500 g", "175 porciones", "Mayor ahorro", "NSA-0013557-2024"],
    description: "La misma fórmula de malta y cacao en presentación metalizada de 3.500 g, con tabla nutricional completa impresa y 175 porciones por bolsa. Es el formato para cafeterías, panaderías, hoteles, colegios y reposterías: reduce el costo por porción y permite estandarizar la receta en cocinas de alto volumen.",
    benefits: [
      { t: "Costo por porción", d: "175 porciones por empaque con dosificación estándar de 28 g, para presupuestar el gasto real por taza servida." },
      { t: "Aporte nutricional declarado", d: "Por cada 100 ml de producto preparado aporta 241,3 mg de calcio, 2,1 mg de hierro, 1,8 mg de zinc, 3,7 g de proteína y vitaminas A, C, D y del complejo B." },
      { t: "Doble uso: bebida y repostería", d: "Funciona como bebida fría o caliente y como base de bizcochos, coberturas, mousses y espolvoreado final." },
      { t: "Control de inventario", d: "Empaque metalizado con cierre, código de barras, lote y notificación sanitaria impresos." }
    ],
    usage: "<strong>En licuadora:</strong> 2 medidas (28 g) + 200 ml. <strong>En vaso:</strong> 5 cucharaditas. <strong>En repostería:</strong> sustituye parcialmente el cacao en polvo de la receta y ajusta el azúcar, ya que el producto viene endulzado.",
    note: "Producto con sello frontal «Exceso en azúcares». Fabricado y empacado por Incolma S.A.S. para CHOCATA S.A.S., Cali — Colombia.",
    sources: [
      { l: "Multiple-micronutrient fortified beverages and micronutrient status in children — meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4446783/" }
    ]
  },

  "proteina": {
    name: "100 % Proteína Whey",
    kicker: "Whey protein concentrate",
    life: "assets/img/life/proteina-2.webp",
    lifeAlt: "Deportista con shaker y empaque de 100 % Proteína CHOCATA en el gimnasio",
    facts: ["400 g", "Materia prima", "Sin saborizantes", "Un solo ingrediente"],
    description: "Concentrado de proteína de suero de leche puro, sin saborizantes ni mezclas. Es materia prima: lo que ves en la etiqueta es literalmente lo único que hay en la bolsa. Se puede tomar solo, mezclado con CHOCATA para darle sabor, o incorporarlo a preparaciones como avena y batidos de fruta.",
    benefits: [
      { t: "Estimula la síntesis proteica muscular", d: "El whey es una proteína de alta calidad rica en aminoácidos esenciales que potencia la síntesis proteica muscular tras el ejercicio, de forma superior a fuentes proteicas de menor calidad." },
      { t: "Respuesta rápida", d: "En las primeras tres horas tras la ingesta genera una respuesta de síntesis proteica mayor que la caseína o la soya, tanto en reposo como después del entrenamiento de fuerza." },
      { t: "Dosis eficaz documentada", d: "Un ensayo en hombres de mediana edad mostró que 20 g de proteína de whey concentrate fueron tan efectivos como 20 g de proteína láctea para elevar la síntesis proteica muscular." },
      { t: "Recuperación funcional", d: "Un metaanálisis reporta un efecto favorable de la suplementación con whey sobre la recuperación temporal de la función muscular tras entrenamiento de fuerza." }
    ],
    usage: "<strong>20 a 40 g por toma</strong> (aprox. 1 a 2 medidas) disueltos en 250–300 ml de agua o leche, después de entrenar o para completar el requerimiento proteico diario. La cantidad total de proteína del día pesa más que el momento exacto de la toma.",
    note: "No apto para personas con alergia a la proteína de leche de vaca. Contiene lactosa en cantidades propias del concentrado.",
    sources: [
      { l: "Effect of protein/EAA and resistance training on hypertrophy: a case for whey protein", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2901380/" },
      { l: "Milk protein vs whey protein: similar increase in muscle protein synthesis in middle-aged men", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4632440/" },
      { l: "Whey protein supplementation and temporal recovery of muscle function — systematic review and meta-analysis", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5852797/" }
    ]
  },

  "creatina": {
    name: "Creatina Monohidratada",
    kicker: "100 % monohidrato",
    life: "assets/img/life/creatina-2.webp",
    lifeAlt: "Entrenamiento de fuerza con Creatina CHOCATA",
    facts: ["250 g", "Materia prima", "Sin sabor", "≈ 50 dosis de 5 g"],
    description: "Creatina monohidratada pura, la forma más estudiada y de mejor relación evidencia-precio del mercado. Sin sabor, sin colorantes, sin mezcla. Se disuelve en agua, jugo, la bebida de CHOCATA o el batido de proteína, y se toma todos los días —entrenes o no—, porque el efecto depende de saturar el músculo, no del momento de la toma.",
    benefits: [
      { t: "El ergogénico con más respaldo", d: "La ISSN la describe como el suplemento nutricional ergogénico más eficaz disponible para aumentar la capacidad de ejercicio de alta intensidad y la masa magra durante el entrenamiento." },
      { t: "Mecanismo conocido", d: "La suplementación eleva la concentración intramuscular de creatina, lo que ayuda a explicar las mejoras observadas en rendimiento de alta intensidad y en las adaptaciones al entrenamiento." },
      { t: "Más allá del gimnasio", d: "La investigación ha explorado efectos sobre recuperación post-ejercicio, prevención de lesiones, termorregulación y rehabilitación, además de aplicaciones clínicas en estudio." },
      { t: "Perfil de seguridad", d: "La ISSN reporta que la suplementación a corto y largo plazo —hasta 30 g/día durante cinco años— es segura y bien tolerada en personas sanas dentro de las pautas recomendadas." }
    ],
    usage: "<strong>3 a 5 g diarios</strong>, todos los días, disueltos en 200–300 ml de líquido. No requiere fase de carga; si eliges hacerla, el protocolo habitual es 20 g/día repartidos en 4 tomas durante 5–7 días y luego mantenimiento. Acompaña con buena hidratación.",
    note: "Si tienes enfermedad renal o tomas medicamentos de forma crónica, consulta con tu médico antes de iniciar.",
    sources: [
      { l: "ISSN position stand: safety and efficacy of creatine supplementation in exercise, sport and medicine", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/" },
      { l: "Common questions and misconceptions about creatine supplementation: what does the evidence really show?", u: "https://pubmed.ncbi.nlm.nih.gov/33557850/" }
    ]
  },

  "pre-workout": {
    name: "Pre-Workout",
    kicker: "Fórmula pre-entrenamiento",
    life: "assets/img/life/pre-workout.webp",
    lifeAlt: "Pareja deportista con shakers CHOCATA antes de entrenar al amanecer",
    facts: ["Dosis 12 g", "Con cafeína anhidra", "Sabor uva-mora", "Beta-alanina · Citrulina"],
    description: "Mezcla pre-entrenamiento con beta-alanina, L-arginina, L-citrulina, L-tirosina, taurina, cafeína anhidra, inositol, electrolitos (sodio, potasio, fosfato monopotásico, citrato de magnesio) y complejo vitamínico A, C, B1, B2, B5, B6, B9 y B12. Diseñada para la sesión que exige concentración y trabajo repetido de alta intensidad.",
    benefits: [
      { t: "Beta-alanina y amortiguación del pH", d: "La posición oficial de la ISSN indica que 4–6 g diarios durante al menos 2 a 4 semanas aumentan la carnosina muscular, que actúa como amortiguador intracelular de pH, con mejoras de rendimiento más marcadas en esfuerzos de 1 a 4 minutos." },
      { t: "Cafeína y rendimiento agudo", d: "La ISSN concluye que la suplementación con cafeína mejora de forma aguda varios aspectos del rendimiento en muchos —aunque no en todos— los estudios revisados." },
      { t: "Fuerza y resistencia muscular", d: "Un ensayo cruzado doble ciego encontró que la cafeína aislada mejoró la fuerza y la resistencia muscular; en ese mismo diseño el citrulina malato aislado no mostró efecto ergogénico." },
      { t: "Electrolitos y vitaminas", d: "Incorpora sodio, potasio y magnesio junto a vitaminas del complejo B, que participan en el metabolismo energético normal." }
    ],
    usage: "<strong>1 cucharada (12 g) en un vaso de agua de 240 ml</strong>, aproximadamente 30 minutos antes de entrenar. Empieza con media dosis para evaluar tu tolerancia a la cafeína. Evita tomarlo en las 6 horas previas a dormir.",
    note: "Contiene cafeína. No recomendado para menores de edad, personas embarazadas o lactando, ni personas sensibles a la cafeína o con hipertensión no controlada. La parestesia (hormigueo) tras la beta-alanina es transitoria e inofensiva.",
    sources: [
      { l: "ISSN position stand: Beta-Alanine", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4501114/" },
      { l: "ISSN position stand: caffeine and exercise performance", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7777221/" },
      { l: "Isolated and combined caffeine and citrulline malate on resistance exercise and jumping performance", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10468939/" }
    ]
  },

  "hidratec": {
    name: "Hidratec",
    kicker: "Bebida de hidratación y energía",
    life: "assets/img/life/hidratante-2.webp",
    lifeAlt: "Ciclista con Hidratec CHOCATA durante la ruta",
    facts: ["Base dextrosa", "Con electrolitos", "Durante el esfuerzo", "Sellos frontales MinSalud"],
    description: "Mezcla en polvo a base de dextrosa para preparar bebida energizante con electrolitos. Está pensada para consumirse durante el esfuerzo prolongado —rutas de ciclismo, carrera de fondo, trabajo bajo calor— cuando el agua sola ya no alcanza para sostener el ritmo.",
    benefits: [
      { t: "Objetivo: evitar la deshidratación excesiva", d: "El position stand del ACSM plantea que la meta de beber durante el ejercicio es prevenir una deshidratación mayor al 2 % del peso corporal y cambios excesivos del balance de electrolitos que comprometan el rendimiento." },
      { t: "Carbohidrato durante el ejercicio", d: "Las bebidas con carbohidratos y electrolitos pueden consumirse antes, durante y después del ejercicio para ayudar a mantener la glucemia, aportar combustible al músculo y reducir el riesgo de deshidratación e hiponatremia." },
      { t: "Absorción y osmolalidad", d: "Un metaanálisis señala que el volumen y la osmolalidad son los factores más influyentes en la hidratación, y que la osmolalidad depende principalmente de la concentración y el formato del carbohidrato." },
      { t: "Plan personalizado", d: "Como la tasa de sudoración y el contenido de electrolitos del sudor varían mucho entre personas, se recomienda ajustar la cantidad a tu propio caso en lugar de seguir una regla fija." }
    ],
    usage: "Prepara según la dosificación indicada en el empaque y bebe <strong>a sorbos regulares durante el esfuerzo</strong>, no solo al final. En sesiones de más de 60–90 minutos o con mucho calor, su aporte de carbohidrato y sodio es especialmente útil.",
    note: "Producto con sellos frontales «Exceso en sodio», «Exceso en azúcares» y «Contiene edulcorantes». Está formulado para el contexto de ejercicio prolongado, no como bebida de consumo cotidiano.",
    sources: [
      { l: "ACSM position stand: exercise and fluid replacement", u: "https://pubmed.ncbi.nlm.nih.gov/17277604/" },
      { l: "Hydrating effects of hypertonic, isotonic and hypotonic sports drinks — systematic meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8803723/" }
    ]
  },

  "colageno": {
    name: "Colágeno Hidrolizado",
    kicker: "100 % péptidos de colágeno",
    life: "assets/img/life/colageno-2.webp",
    lifeAlt: "Mujer con vaso de colágeno CHOCATA tras una clase de yoga al aire libre",
    facts: ["200 g", "Materia prima", "Sin sabor", "Soluble en frío"],
    description: "Colágeno hidrolizado puro en polvo. La hidrólisis fragmenta la proteína en péptidos de bajo peso molecular que se disuelven sin grumos y sin aportar sabor, por lo que se puede añadir al agua, al jugo, al café o a la misma bebida de CHOCATA sin alterar la preparación.",
    benefits: [
      { t: "Piel: hidratación y elasticidad", d: "Un metaanálisis de 26 ensayos aleatorizados con 1.721 participantes encontró mejoras significativas en hidratación y elasticidad de la piel frente a placebo." },
      { t: "Evidencia replicada", d: "Una revisión posterior de 14 estudios con 967 participantes reportó mejoras sustanciales en niveles de humedad y elasticidad cutánea comparadas con placebo." },
      { t: "Dolor articular", d: "Una revisión de 69 ensayos clínicos concluyó que el colágeno hidrolizado es seguro como suplemento dietario en humanos para el manejo del dolor articular." },
      { t: "El factor tiempo", d: "Los protocolos que muestran reducción de arrugas y mejora de elasticidad e hidratación suelen requerir alrededor de 90 días de consumo diario. No es un producto de efecto inmediato." }
    ],
    usage: "<strong>10 g diarios</strong> (aprox. 1 cucharada) disueltos en 200 ml de agua, jugo, café o chocolate. Puede tomarse en cualquier momento del día. Para acompañar la síntesis de colágeno del propio organismo, combínalo con una fuente de vitamina C.",
    note: "El colágeno es una proteína incompleta: no reemplaza tu ingesta proteica diaria, la complementa.",
    sources: [
      { l: "Effects of hydrolyzed collagen supplementation on skin aging — systematic review and meta-analysis", u: "https://pubmed.ncbi.nlm.nih.gov/33742704/" },
      { l: "Impact of hydrolyzed collagen oral supplementation on skin rejuvenation — systematic review and meta-analysis", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10773595/" },
      { l: "Effects of a hydrolyzed collagen supplement on pain perception and joint range in chronic knee pain", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12293524/" }
    ]
  },

  "magnesio": {
    name: "Citrato de Magnesio",
    kicker: "100 % citrato de magnesio",
    life: "assets/img/life/magnesio-2.webp",
    lifeAlt: "Empaque de Citrato de Magnesio CHOCATA sobre la mesa de noche",
    facts: ["250 g", "Materia prima", "Alta biodisponibilidad", "Un solo ingrediente"],
    description: "Citrato de magnesio puro, la sal orgánica que mejor equilibra absorción y tolerancia digestiva. Se disuelve en agua y suele ubicarse al final del día, dentro de la rutina de descanso y recuperación muscular.",
    benefits: [
      { t: "Cofactor de más de 300 enzimas", d: "Según los NIH, el magnesio participa como cofactor en más de 300 sistemas enzimáticos que regulan la síntesis proteica, la función muscular y nerviosa, el control de la glucosa en sangre y la regulación de la presión arterial." },
      { t: "Contracción muscular y ritmo cardíaco", d: "Interviene en el transporte activo de calcio y potasio a través de las membranas celulares, proceso clave para la conducción del impulso nervioso, la contracción muscular y el ritmo cardíaco normal." },
      { t: "Sueño y sistema nervioso", d: "La literatura describe que el magnesio reduce la excitabilidad del sistema nervioso y participa en la relajación muscular y en la regulación de los ritmos circadianos; su deficiencia se asocia con menor duración y calidad del sueño." },
      { t: "Por qué citrato", d: "Las formas de magnesio que se disuelven bien en líquido presentan mayor absorción; citrato, aspartato, lactato y cloruro tienden a tener mayor biodisponibilidad que el óxido y el sulfato." }
    ],
    usage: "Sigue la dosificación indicada en el empaque, habitualmente <strong>disuelto en un vaso de agua al final del día</strong>. Empieza por la dosis menor: en exceso, el citrato de magnesio tiene efecto laxante.",
    note: "Si tienes insuficiencia renal o tomas antibióticos, bifosfonatos o diuréticos, consulta con tu médico: el magnesio puede interactuar con varios medicamentos.",
    sources: [
      { l: "Magnesium — Health Professional Fact Sheet, NIH Office of Dietary Supplements", u: "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/" },
      { l: "Predicting and testing bioavailability of magnesium supplements", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6683096/" },
      { l: "The mechanisms of magnesium in sleep disorders", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12535714/" }
    ]
  },

  "vitamina-c": {
    name: "Vitamina C pura",
    kicker: "100 % ácido ascórbico",
    life: "assets/img/life/vitamina-c-2.webp",
    lifeAlt: "Preparación de Vitamina C CHOCATA en la cocina de casa",
    facts: ["250 g", "Materia prima", "Sin excipientes", "Ácido ascórbico"],
    description: "Ácido ascórbico puro en polvo, sin excipientes, colorantes ni saborizantes. Al ser materia prima puedes ajustar la cantidad exacta que necesitas y disolverla en agua, jugo o una preparación fría. Su sabor es naturalmente ácido.",
    benefits: [
      { t: "Síntesis de colágeno", d: "La vitamina C es requerida para la biosíntesis de colágeno, L-carnitina y ciertos neurotransmisores. El colágeno es componente esencial del tejido conectivo y cumple un papel central en la cicatrización de heridas." },
      { t: "Función inmune", d: "Los NIH señalan que la vitamina C desempeña un papel importante en la función inmune y contribuye a estimular el sistema inmunitario." },
      { t: "Absorción de hierro", d: "Mejora la absorción del hierro no hemo, la forma presente en alimentos de origen vegetal. Por eso conviene tomarla junto con las comidas." },
      { t: "Antioxidante", d: "Actúa como antioxidante, contribuyendo a la protección frente al estrés oxidativo." }
    ],
    usage: "Disuelve la cantidad indicada en el empaque en <strong>200 ml de agua o jugo</strong>, preferiblemente con una comida para aprovechar el efecto sobre la absorción de hierro. Es hidrosoluble: el exceso se elimina por orina, no se acumula.",
    note: "Dosis muy altas pueden causar molestias gastrointestinales. Si tomas anticoagulantes o tienes antecedentes de cálculos renales de oxalato, consulta con tu médico.",
    sources: [
      { l: "Vitamin C — Health Professional Fact Sheet, NIH Office of Dietary Supplements", u: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/" },
      { l: "Dietary sources, bioavailability and functions of ascorbic acid: common cold, tissue healing and iron metabolism", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10749424/" }
    ]
  },

  "remolacha": {
    name: "Remolacha en polvo",
    kicker: "100 % pura y natural",
    life: "assets/img/life/remolacha.webp",
    lifeAlt: "Dos ciclistas tomando bebida de remolacha CHOCATA antes de una ruta",
    facts: ["200 g", "Extracto de remolacha", "Fuente de nitratos", "Materia prima"],
    description: "Extracto de remolacha en polvo, 100 % puro. Es el aliado clásico del deporte de resistencia por su contenido de nitratos dietarios, y el color intenso que le da a la bebida es exactamente el de la betalaína natural de la raíz.",
    benefits: [
      { t: "La ruta nitrato–nitrito–óxido nítrico", d: "Tras la ingesta, el nitrato se convierte en nitrito y, en condiciones de baja disponibilidad de oxígeno, en óxido nítrico, molécula con un papel importante en el control vascular y metabólico." },
      { t: "Economía de oxígeno", d: "La suplementación con nitrato dietario reduce el costo de oxígeno del ejercicio submáximo y, en determinadas circunstancias, puede mejorar la tolerancia al ejercicio y el rendimiento." },
      { t: "Capacidad de ejercicio", d: "Se ha demostrado que el nitrato dietario aumenta la capacidad de ejercicio tanto en adultos jóvenes como en adultos mayores." },
      { t: "Presión arterial", d: "Ensayos controlados documentan reducciones de la presión arterial en reposo y durante el ejercicio, aunque el efecto de una dosis única es de corta duración." }
    ],
    usage: "Disuelve la porción indicada en <strong>200–300 ml de agua o jugo, entre 2 y 3 horas antes</strong> de la sesión de resistencia. En protocolos de varios días se toma de forma diaria para sostener los niveles plasmáticos.",
    note: "Puede teñir la orina y las heces de color rojizo; es un efecto normal e inofensivo de las betalaínas. Evita el enjuague bucal antibacteriano cerca de la toma: elimina las bacterias orales que convierten el nitrato en nitrito.",
    sources: [
      { l: "Dietary nitrate supplementation and exercise performance", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4008816/" },
      { l: "Physiological effects of beetroot in athletes and patients", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6952046/" },
      { l: "Beetroot juice and 24-h aortic and brachial blood pressure — crossover RCT", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6369216/" }
    ]
  },

  "latte-dorato": {
    name: "Latte Dorato",
    kicker: "Bebida caliente funcional",
    life: "assets/img/life/latte-2.webp",
    lifeAlt: "Taza de Latte Dorato CHOCATA junto al empaque",
    facts: ["400 g", "67 porciones", "6 ingredientes", "Ingredientes naturales"],
    description: "Mezcla en polvo de quinua, maca, cúrcuma, canela, jengibre y pimienta para preparar bebida caliente. Es la versión andina del golden latte: la cúrcuma pone el color y el perfil antioxidante, la pimienta está ahí por una razón técnica —mejorar la absorción de la curcumina— y la quinua y la maca aportan el cuerpo y el fondo dulce-terroso.",
    benefits: [
      { t: "Curcumina: antiinflamatoria y antioxidante", d: "La curcumina, extraída del rizoma de Curcuma longa, es reconocida por sus actividades antiinflamatoria y antioxidante. La FDA la considera GRAS (generalmente reconocida como segura)." },
      { t: "Por qué lleva pimienta", d: "La piperina administrada junto con curcumina incrementa de forma marcada su biodisponibilidad, al aumentar el flujo sanguíneo intestinal y la permeabilidad del enterocito y reducir la actividad de la glucuronidasa. Sin pimienta, buena parte de la curcumina no se absorbe." },
      { t: "Maca: perfil nutricional", d: "La maca seca aporta 8,9–11,6 % de proteínas, fibra, aminoácidos esenciales, ácidos grasos y minerales como hierro, calcio y zinc, además de macamidas, macaenos, polisacáridos y flavonoles asociados con actividad antifatiga, antioxidante y neuroprotectora." },
      { t: "Sin cafeína", d: "A diferencia del café o el té, es una bebida caliente reconfortante que puede tomarse en la noche." }
    ],
    usage: "Disuelve <strong>una porción (≈ 6 g) en 200 ml de leche o bebida vegetal caliente</strong> y revuelve bien. 67 porciones aproximadas por bolsa. Queda especialmente bien con leche entera o de coco, que ayuda a vehiculizar los compuestos liposolubles.",
    note: "Si tomas anticoagulantes, tienes cálculos biliares o vas a someterte a cirugía, consulta con tu médico antes de consumir cúrcuma de forma regular.",
    sources: [
      { l: "Curcumin-piperine co-supplementation and human health: comprehensive review of preclinical and clinical studies", u: "https://pubmed.ncbi.nlm.nih.gov/36720711/" },
      { l: "Curcumin: a review of its effects on human health", u: "https://pubmed.ncbi.nlm.nih.gov/29065496/" },
      { l: "Exploring the chemical and pharmacological variability of Lepidium meyenii (maca)", u: "https://pubmed.ncbi.nlm.nih.gov/38440178/" },
      { l: "Effects of maca on physical performance in animals and humans — systematic review and meta-analysis", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11723211/" }
    ]
  }

};
