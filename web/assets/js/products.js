/* =========================================================================
   CHOCATA — Fichas de producto

   Cada beneficio se escribe para dos lectores a la vez: quien entrena y quien
   simplemente quiere estar mejor. Se dice qué hace, cuánto y para quién, con
   la cifra del estudio cuando existe y traducida a algo cotidiano. Ninguna
   afirmación va más allá de lo que respalda la fuente enlazada.
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
    { p: "chocata-tradicional", w: "El chocolate de la mesa familiar: 25 g por taza, desde 200 g hasta 3.500 g." }
  ],
  defensas: [
    { p: "vitamina-c",       w: "Acorta y suaviza los resfriados, y multiplica la absorción del hierro de origen vegetal." },
    { p: "chocata-granel",   w: "Vehículo de calcio, hierro, zinc y vitaminas A, C, D y del complejo B para toda la familia." }
  ],
  piel: [
    { p: "colageno",         w: "10 g diarios. Los metaanálisis miden mejoras de hidratación y elasticidad hacia los 90 días." },
    { p: "vitamina-c",       w: "El cuerpo la necesita para sintetizar su propio colágeno: van juntas." },
    { p: "latte-dorato",     w: "Cúrcuma con pimienta: efecto analgésico a corto plazo en dolor de rodilla." }
  ],
  descanso: [
    { p: "magnesio",         w: "Reduce el tiempo que se tarda en dormirse y acompaña la relajación muscular." },
    { p: "latte-dorato",     w: "Ritual caliente de la noche, sin cafeína." },
    { p: "colageno",         w: "Sin sabor: se disuelve en la misma bebida de la noche." }
  ]
};

window.CHOCATA_PRODUCTS = {

  "chocata-premium": {
    name: "CHOCATA Premium",
    kicker: "Bebida de malta y cacao",
    life: "assets/img/life/premium.webp",
    focus: "44% 42%",
    lifeAlt: "Pareja deportista disfrutando CHOCATA Premium frío al aire libre",
    prices: [{ s: "200 g", p: "$16.000" }, { s: "500 g", p: "$32.000" }],
    facts: ["200 g y 500 g", "Dosis 25 g", "Con estevia", "Contiene edulcorantes · MinSalud"],
    description: "Alimento en polvo a base de malta para preparar bebida, endulzado con estevia. Es la versión ligera del chocolate de siempre: mismo cuerpo y mismo sabor a cacao, con menos azúcar añadido que la referencia tradicional. Se prepara frío o caliente y funciona igual de bien en licuadora con leche que a cucharaditas en un vaso de agua.",
    benefits: [
      { t: "Energía que llega rápido", d: "La malta aporta carbohidratos de rápida disponibilidad. Para quien entrena, es la recarga antes o después de la sesión; para el resto, el desayuno que sostiene la mañana de colegio o de trabajo." },
      { t: "Calcio, hierro y zinc en una taza", d: "Las bebidas fortificadas son un vehículo práctico de micronutrientes. En escolares, los metaanálisis muestran que mejoran la hemoglobina y la ferritina sérica frente a bebidas con las mismas calorías pero sin fortificar." },
      { t: "Menos azúcar, el mismo gusto", d: "La estevia reemplaza parte del azúcar añadido de la fórmula tradicional. Sirve para quien cuida el consumo de azúcar sin querer renunciar al chocolate de la tarde." },
      { t: "El suplemento que sí se toma", d: "Un sabor que la familia ya reconoce hace que el hábito dure meses, y la constancia es la que produce los resultados." }
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
    focus: "52% 36%",
    lifeAlt: "Taza de chocolate CHOCATA caliente en la mesa del desayuno",
    prices: [{ s: "200 g", p: "$9.000" }, { s: "500 g", p: "$22.000" }, { s: "1.500 g", p: "$45.000" }, { s: "3.500 g", p: "$95.000" }],
    facts: ["200 g a 3.500 g", "Dosis 25 g", "Sabor chocolate natural", "Exceso en azúcares · MinSalud"],
    description: "El chocolate granulado de toda la vida: se disuelve rápido, no deja grumos y conserva el sabor a cacao natural que reconoce cualquier hogar colombiano. Pensado para la taza de la mañana, el algo de la tarde y la sobremesa. Es la referencia con la que nació la marca.",
    benefits: [
      { t: "El desayuno que los niños sí se toman", d: "Aporta carbohidratos que el cuerpo usa como combustible inmediato. Como parte de un desayuno completo, ayuda a llegar a media mañana sin el bajón que deja salir de casa en ayunas." },
      { t: "Se disuelve sin grumos", d: "El granulado se integra en frío o en caliente sin licuadora ni molinillo. Práctico para la lonchera, la oficina o la olla de la casa." },
      { t: "Cuatro tamaños, un mismo sabor", d: "De 200 g para probar a 3.500 g para el negocio, con la misma dosificación de 25 g por taza. El costo por taza baja a medida que sube el formato." },
      { t: "Un ritual, no una porción", d: "Está pensado para la mesa compartida: el algo de la tarde, la sobremesa, el chocolate después del colegio." }
    ],
    usage: "Disuelve <strong>25 g (2 cucharadas) en 200 ml</strong> de leche o agua caliente y revuelve. También funciona frío. Consérvalo en un lugar fresco y seco.",
    note: "Producto con sello frontal «Exceso en azúcares». Modera su consumo dentro de una alimentación equilibrada, especialmente en niños.",
    sources: [
      { l: "Multiple-micronutrient fortified beverages and micronutrient status in children — meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4446783/" },
      { l: "Consumption of malted drinks among primary school children — MyBreakfast study", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4697324/" }
    ]
  },

  "chocata-granel": {
    name: "CHOCATA Granel 3,5 kg",
    kicker: "Formato institucional y repostería",
    life: "assets/img/life/reposteria.webp",
    focus: "46% 48%",
    lifeAlt: "Chef pastelero cubriendo una torta con chocolate CHOCATA",
    prices: [{ s: "3.500 g", p: "$95.000" }],
    facts: ["3.500 g", "175 porciones", "Mayor ahorro", "NSA-0013557-2024"],
    description: "La misma fórmula de malta y cacao en presentación metalizada de 3.500 g, con tabla nutricional completa impresa y 175 porciones por bolsa. Es el formato para cafeterías, panaderías, hoteles, colegios y reposterías: reduce el costo por porción y permite estandarizar la receta en cocinas de alto volumen.",
    benefits: [
      { t: "Sabes cuánto te cuesta cada taza", d: "175 porciones por bolsa con dosificación estándar de 28 g. Con el precio del formato puedes calcular el costo real de cada taza servida y fijar tu carta con números, no a ojo." },
      { t: "Lo que aporta cada 100 ml", d: "241,3 mg de calcio, 2,1 mg de hierro, 1,8 mg de zinc, 3,7 g de proteína y vitaminas A, C, D y del complejo B. Útil si sirves a colegios o comedores que deben reportar aporte nutricional." },
      { t: "La misma bolsa para la bebida y la torta", d: "Funciona como chocolate frío o caliente y como base de bizcochos, coberturas, mousses y espolvoreado. Una sola referencia en inventario en lugar de dos." },
      { t: "Listo para auditoría", d: "Empaque metalizado con cierre, código de barras, lote, fecha de vencimiento y notificación sanitaria impresos." }
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
    focus: "56% 46%",
    lifeAlt: "Deportista con shaker y empaque de 100 % Proteína CHOCATA en el gimnasio",
    prices: [{ s: "400 g", p: "$70.000" }],
    facts: ["400 g", "≈ 16 porciones", "Dosis 25 g", "Un solo ingrediente"],
    description: "Concentrado de proteína de suero de leche puro, sin saborizantes ni mezclas. Es materia prima: lo que ves en la etiqueta es literalmente lo único que hay en la bolsa. Se puede tomar solo, mezclado con CHOCATA para darle sabor, o incorporarlo a preparaciones como avena y batidos de fruta.",
    benefits: [
      { t: "Construye músculo mejor que otras proteínas", d: "En las tres horas siguientes a la toma dispara la síntesis proteica más que la caseína o la soya, en reposo y después de entrenar. Con 20 g por toma ya se obtiene el efecto: no hace falta doblar la dosis." },
      { t: "Sirve para no perder músculo con la edad", d: "No es solo cosa de gimnasio. En adultos mayores con sarcopenia, el whey junto a entrenamiento de fuerza mejora la masa muscular y la fuerza de agarre más que el entrenamiento solo. Comparado con otras cinco fuentes proteicas, fue el más efectivo en masa, fuerza de prensión y velocidad al caminar." },
      { t: "Recuperas más rápido entre sesiones", d: "Un metaanálisis documenta que acelera la recuperación de la función muscular en los días siguientes a un entrenamiento de fuerza exigente. Se nota en quien entrena tres o más veces por semana." },
      { t: "Llena de verdad", d: "La proteína es el macronutriente que más sacia. Un batido a media tarde corta el picoteo mejor que un snack de la misma cantidad de calorías." }
    ],
    usage: "<strong>25 g (2 cucharadas) en un vaso de leche o agua</strong>, después de entrenar o para completar el requerimiento proteico del día. Lo que manda es el total de proteína de la jornada, más que la hora exacta de la toma.",
    note: "No apto para personas con alergia a la proteína de leche de vaca. Contiene lactosa en las cantidades propias de un concentrado.",
    sources: [
      { l: "Effect of protein/EAA and resistance training on hypertrophy: a case for whey protein", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2901380/" },
      { l: "Milk protein vs whey protein: similar increase in muscle protein synthesis in middle-aged men", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4632440/" },
      { l: "Whey protein supplementation and temporal recovery of muscle function — systematic review and meta-analysis", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5852797/" },
      { l: "Whey protein during resistance training on muscle mass and strength in older people with sarcopenia — meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10421506/" },
      { l: "Comparative efficacy of different protein supplements on sarcopenia — network meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11013298/" }
    ]
  },

  "creatina": {
    name: "Creatina Monohidratada",
    kicker: "100 % monohidrato",
    life: "assets/img/life/creatina-2.webp",
    lifeAlt: "Entrenamiento de fuerza con Creatina CHOCATA",
    prices: [{ s: "250 g", p: "$50.000" }],
    facts: ["250 g", "≈ 50 porciones", "Dosis 5 g", "Sin sabor"],
    description: "Creatina monohidratada pura, la forma más estudiada y de mejor relación evidencia-precio del mercado. Sin sabor, sin colorantes, sin mezcla. Se disuelve en agua, jugo, la bebida de CHOCATA o el batido de proteína, y se toma todos los días —entrenes o no—, porque el efecto depende de saturar el músculo, no del momento de la toma.",
    benefits: [
      { t: "Las repeticiones que antes no salían", d: "La Sociedad Internacional de Nutrición Deportiva la describe como el suplemento nutricional más eficaz disponible para aumentar la capacidad de trabajo de alta intensidad y la masa magra. En la práctica: una o dos repeticiones más en las series pesadas, y eso acumulado es lo que hace la diferencia." },
      { t: "Después de los 50 importa más, no menos", d: "En adultos mayores, y sin necesidad de entrenar, aumenta la masa corporal, la resistencia a la fatiga y la fuerza, y mejora el desempeño en actividades de la vida diaria: levantarse de una silla, subir escaleras, cargar mercado." },
      { t: "Ayuda a la cabeza cuando está exigida", d: "Una dosis única mejora el rendimiento cognitivo y la velocidad de procesamiento cuando se ha dormido poco. Útil en turnos largos, viajes o semanas de mucha carga." },
      { t: "Barata y segura a largo plazo", d: "La ISSN reporta que su uso hasta 30 g al día durante cinco años es seguro y bien tolerado en personas sanas dentro de las pautas recomendadas. Con 5 g diarios, una bolsa de 250 g dura unos 50 días." }
    ],
    usage: "<strong>5 g (una cucharada) en un vaso de agua</strong>, todos los días. Tómala antes del entreno si te sirve para acordarte, pero el día que no entrenes tómala igual: lo que importa es la constancia. No requiere fase de carga ni ciclos de descanso.",
    note: "Es normal ganar entre 1 y 2 kg las primeras semanas: es agua dentro del músculo, no grasa. Si tienes enfermedad renal o tomas medicamentos de forma crónica, consulta con tu médico antes de iniciar.",
    sources: [
      { l: "ISSN position stand: safety and efficacy of creatine supplementation in exercise, sport and medicine", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/" },
      { l: "Common questions and misconceptions about creatine supplementation: what does the evidence really show?", u: "https://pubmed.ncbi.nlm.nih.gov/33557850/" },
      { l: "Creatine monohydrate supplementation for older adults and clinical populations", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12272710/" },
      { l: "Single dose creatine improves cognitive performance during sleep deprivation", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10902318/" },
      { l: "Creatine supplementation and cognition: evidence from a systematic review (resultados nulos en jóvenes descansados)", u: "https://pubmed.ncbi.nlm.nih.gov/38582412/" }
    ]
  },

  "pre-workout": {
    name: "Pre-Workout",
    kicker: "Fórmula pre-entrenamiento",
    life: "assets/img/life/pre-workout.webp",
    focus: "46% 42%",
    lifeAlt: "Pareja deportista con shakers y empaque de Pre-Workout CHOCATA",
    prices: [{ s: "200 g", p: "$30.000" }],
    facts: ["200 g", "Dosis 12 g", "Con cafeína anhidra", "Sabor uva-mora"],
    description: "Mezcla pre-entrenamiento con beta-alanina, L-arginina, L-citrulina, L-tirosina, taurina, cafeína anhidra, inositol, electrolitos (sodio, potasio, fosfato monopotásico, citrato de magnesio) y complejo vitamínico A, C, B1, B2, B5, B6, B9 y B12. Diseñada para la sesión que exige concentración y trabajo repetido de alta intensidad.",
    benefits: [
      { t: "Aguantar el minuto que arde", d: "La beta-alanina eleva la carnosina muscular, que amortigua la acidez que se acumula en el esfuerzo intenso. La posición oficial de la ISSN sitúa el efecto más claro en esfuerzos de 1 a 4 minutos: la serie larga, el remate de la subida, el último asalto." },
      { t: "Cafeína: el estimulante más estudiado que existe", d: "La ISSN concluye que mejora de forma aguda varios aspectos del rendimiento. Un ensayo cruzado doble ciego encontró mejoras en fuerza y en resistencia muscular con cafeína aislada." },
      { t: "Enfoque, no solo energía", d: "El complejo B participa en el metabolismo energético normal y los electrolitos acompañan la hidratación durante la sesión. La sensación buscada es de concentración sostenida, no de nerviosismo." },
      { t: "Rinde más con las semanas", d: "La cafeína actúa desde el primer día. La beta-alanina acumula carnosina con 2 a 4 semanas de uso continuo, así que la fórmula da su mejor versión cuando se usa de forma sostenida." }
    ],
    usage: "<strong>1 cucharada (12 g) en un vaso de agua de 240 ml</strong>, unos 30 minutos antes de entrenar. Empieza con media dosis para medir tu tolerancia a la cafeína.",
    note: "Contiene cafeína: evítalo en las 6 horas previas a dormir. No recomendado para menores de edad, personas embarazadas o lactando, ni con hipertensión no controlada. El hormigueo en cara y manos tras tomarlo es parestesia por la beta-alanina: es transitoria e inofensiva.",
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
    prices: [{ s: "Presentación única", p: "$30.000" }],
    facts: ["Dosis 7 g en 750 ml", "≈ 50 porciones", "Con taurina y guaraná", "9 vitaminas y 6 minerales"],
    description: "Mezcla en polvo a base de dextrosa para preparar bebida energizante con electrolitos. Está pensada para consumirse durante el esfuerzo prolongado —rutas de ciclismo, carrera de fondo, partidos largos, trabajo bajo calor— cuando el agua sola ya no alcanza para sostener el ritmo.",
    benefits: [
      { t: "El 2 % que te frena", d: "El position stand del ACSM fija el objetivo con un número: no perder más del 2 % del peso corporal en líquidos. En una persona de 70 kg eso es kilo y medio de sudor, algo que se alcanza en una hora larga de calor. Pasado ese punto el rendimiento cae." },
      { t: "Cuando el agua sola ya no alcanza", d: "En sesiones que pasan de la hora, las bebidas con carbohidratos y electrolitos ayudan a mantener la glucemia, dan combustible al músculo y reducen el riesgo de deshidratación y de hiponatremia." },
      { t: "Lo que decide es el volumen", d: "Un metaanálisis de bebidas hipertónicas, isotónicas e hipotónicas concluye que el volumen y la osmolalidad son los factores más influyentes, y que la osmolalidad depende sobre todo de la concentración de carbohidrato." },
      { t: "Cada persona suda distinto", d: "La tasa de sudoración y la sal que se pierde varían mucho de una persona a otra. Pésate antes y después de una sesión larga: la diferencia es tu guía, no la etiqueta." }
    ],
    usage: "<strong>7 g (1 cucharada) en 750 ml de agua</strong>, el tamaño del tarro que se usa en la práctica deportiva. Bebe a sorbos regulares durante el esfuerzo, no todo al final.",
    note: "Producto con sellos frontales «Exceso en sodio», «Exceso en azúcares» y «Contiene edulcorantes». Está formulado para el contexto de ejercicio prolongado, no como bebida de consumo cotidiano ni para niños.",
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
    prices: [{ s: "200 g", p: "$30.000" }],
    facts: ["200 g", "Materia prima", "Sin sabor", "Soluble en frío"],
    description: "Colágeno hidrolizado puro en polvo. La hidrólisis fragmenta la proteína en péptidos de bajo peso molecular que se disuelven sin grumos y sin aportar sabor, por lo que se puede añadir al agua, al jugo, al café o a la misma bebida de CHOCATA sin alterar la preparación.",
    benefits: [
      { t: "Piel más hidratada y más elástica", d: "Un metaanálisis de 26 ensayos aleatorizados con 1.721 participantes encontró mejoras significativas en hidratación y elasticidad de la piel frente a placebo, además de reducción de arrugas." },
      { t: "No es un hallazgo aislado", d: "Una revisión posterior e independiente, con 14 estudios y 967 participantes, llegó a la misma conclusión. Que dos revisiones distintas coincidan es lo que separa un efecto real de una casualidad." },
      { t: "Rodillas que aguantan el día", d: "Una revisión de 69 ensayos clínicos concluyó que el colágeno hidrolizado es seguro como suplemento dietario para el manejo del dolor articular. Interesa tanto a quien corre como a quien pasa el día de pie." },
      { t: "La constancia de tres meses", d: "Los protocolos que muestran resultados usan al menos 90 días de consumo diario. Tomarlo todos los días es la parte que hace el trabajo." }
    ],
    usage: "<strong>10 g (una cucharada) en 200 ml</strong> de agua, jugo, café o chocolate. A cualquier hora del día. Combínalo con una fuente de vitamina C: el organismo la necesita para fabricar su propio colágeno.",
    note: "El colágeno es una proteína incompleta: complementa tu ingesta proteica diaria, no la reemplaza.",
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
    prices: [{ s: "250 g", p: "$21.000" }],
    facts: ["250 g", "≈ 50 porciones", "Dosis 5 g", "Alta biodisponibilidad"],
    description: "Citrato de magnesio puro, la sal orgánica que mejor equilibra absorción y tolerancia digestiva. Se disuelve en agua y suele ubicarse al final del día, dentro de la rutina de descanso y recuperación muscular.",
    benefits: [
      { t: "El mineral del que casi nadie llega a la dosis", d: "Según los NIH, participa como cofactor en más de 300 sistemas enzimáticos: síntesis proteica, función muscular y nerviosa, control de la glucosa y regulación de la presión arterial. Es de los déficits más comunes en dietas urbanas." },
      { t: "Músculo que se contrae y se suelta", d: "Interviene en el transporte de calcio y potasio a través de las membranas celulares, base de la conducción nerviosa, la contracción muscular y el ritmo cardíaco normal. De ahí su uso tras entrenamientos exigentes." },
      { t: "Dormirse antes", d: "Un metaanálisis en adultos mayores con insomnio midió una reducción de unos 17 minutos en el tiempo que se tarda en conciliar el sueño." },
      { t: "Acompaña el control de la presión arterial", d: "Los metaanálisis muestran descensos de la presión arterial, y el efecto es mayor en quienes ya toman medicación antihipertensiva: hasta −7,7 mmHg de sistólica." }
    ],
    usage: "<strong>5 g (una cucharadita) en un vaso de agua</strong>, aproximadamente 2 horas antes de dormir. Empieza por la dosis menor: en exceso, el citrato de magnesio tiene efecto laxante.",
    note: "Si tienes insuficiencia renal o tomas antibióticos, bifosfonatos o diuréticos, consulta con tu médico: el magnesio puede interactuar con varios medicamentos.",
    sources: [
      { l: "Magnesium — Health Professional Fact Sheet, NIH Office of Dietary Supplements", u: "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/" },
      { l: "Predicting and testing bioavailability of magnesium supplements", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6683096/" },
      { l: "Oral magnesium supplementation for insomnia in older adults — systematic review and meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8053283/" },
      { l: "Magnesium supplementation and blood pressure — systematic review and meta-analysis of RCTs", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12529988/" }
    ]
  },

  "vitamina-c": {
    name: "Vitamina C pura",
    kicker: "100 % ácido ascórbico",
    life: "assets/img/life/vitamina-c-2.webp",
    lifeAlt: "Preparación de Vitamina C CHOCATA en la cocina de casa",
    prices: [{ s: "250 g", p: "$15.000" }],
    facts: ["250 g", "≈ 100 porciones", "Dosis 2,5 g", "Sin excipientes"],
    description: "Ácido ascórbico puro en polvo, sin excipientes, colorantes ni saborizantes. Al ser materia prima puedes ajustar la cantidad exacta que necesitas y disolverla en agua, jugo o una preparación fría. Su sabor es naturalmente ácido.",
    benefits: [
      { t: "Resfriados más cortos y más llevaderos", d: "Un metaanálisis reciente midió una reducción del 15 % en la severidad de los síntomas. Sobre la duración, la revisión clásica encontró resfriados un 8 % más cortos en adultos y un 14 % en niños con toma diaria sostenida." },
      { t: "Multiplica el hierro que aprovechas", d: "Aumenta la absorción del hierro no hemo, el de origen vegetal, y el efecto crece con la dosis: en comidas de prueba, la absorción se multiplicó hasta por nueve. Importa para quien come poca carne, para mujeres con menstruaciones abundantes y para deportistas de fondo." },
      { t: "Sin ella no hay colágeno", d: "El organismo la necesita para fabricar colágeno, la proteína del tejido conectivo, y también L-carnitina y varios neurotransmisores. Es la razón por la que se recomienda junto al colágeno hidrolizado." },
      { t: "No se acumula", d: "Es hidrosoluble: lo que el cuerpo no usa se elimina por orina. Por eso conviene una toma diaria constante en lugar de una dosis muy alta de vez en cuando." }
    ],
    usage: "<strong>2,5 g (media cucharadita) en un vaso de agua</strong> o jugo, preferiblemente con una comida para aprovechar el efecto sobre la absorción de hierro.",
    note: "Dosis muy altas pueden causar molestias gastrointestinales. Si tomas anticoagulantes o tienes antecedentes de cálculos renales de oxalato, consulta con tu médico.",
    sources: [
      { l: "Vitamin C — Health Professional Fact Sheet, NIH Office of Dietary Supplements", u: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/" },
      { l: "Vitamin C reduces the severity of common colds — meta-analysis", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10712193/" },
      { l: "Vitamin C for preventing and treating the common cold — Cochrane review", u: "https://pubmed.ncbi.nlm.nih.gov/23440782/" },
      { l: "Ascorbic acid: sources, bioavailability, tissue healing and iron metabolism", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10749424/" }
    ]
  },

  "remolacha": {
    name: "Remolacha en polvo",
    kicker: "100 % pura y natural",
    life: "assets/img/life/remolacha.webp",
    focus: "46% 44%",
    lifeAlt: "Ciclistas tomando bebida de remolacha CHOCATA antes de rodar",
    prices: [{ s: "200 g", p: "$40.000" }],
    facts: ["200 g", "≈ 25 porciones", "Dosis 8 g", "100 % pura y natural"],
    description: "Extracto de remolacha en polvo, 100 % puro. Es el aliado clásico del deporte de resistencia por su contenido de nitratos dietarios, y el color intenso que le da a la bebida es exactamente el de la betalaína natural de la raíz.",
    benefits: [
      { t: "El mismo ritmo con menos oxígeno", d: "El nitrato se convierte en óxido nítrico y reduce el costo de oxígeno del ejercicio submáximo. Traducido: el ritmo que antes te costaba, ahora te cuesta un poco menos. Es de los pocos suplementos con efecto medible en fondo." },
      { t: "Baja la presión arterial", d: "Un metaanálisis midió un descenso de 4,4 mmHg en la sistólica. En adultos mayores, dos semanas de suplementación dieron caídas de unos 6 mmHg de sistólica y 4 de diastólica. Interesa a mucha más gente que a los ciclistas." },
      { t: "También si no compites", d: "Se ha demostrado que aumenta la capacidad de ejercicio tanto en adultos jóvenes como en mayores. Caminar, subir escaleras o el trabajo físico entran en esa categoría." },
      { t: "Un detalle que marca la diferencia", d: "El nitrato se convierte en nitrito gracias a bacterias que viven en tu boca. Evita el enjuague bucal antibacteriano cerca de la toma y aprovecharás todo el efecto." }
    ],
    usage: "<strong>8 g (una cucharada) en un vaso de agua</strong> o jugo, entre 2 y 3 horas antes del esfuerzo. En protocolos de varios días se toma a diario para sostener los niveles plasmáticos.",
    note: "Puede teñir la orina y las heces de color rojizo: es un efecto normal e inofensivo de las betalaínas, no sangrado.",
    sources: [
      { l: "Dietary nitrate supplementation and exercise performance", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4008816/" },
      { l: "Physiological effects of beetroot in athletes and patients", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6952046/" },
      { l: "Inorganic nitrate and beetroot juice supplementation reduces blood pressure in adults — meta-analysis", u: "https://pubmed.ncbi.nlm.nih.gov/23596162/" },
      { l: "Nitrate-rich beetroot juice in older vs younger adults — plasma nitrite and blood pressure", u: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6683255/" }
    ]
  },

  "latte-dorato": {
    name: "Latte Dorato",
    kicker: "Bebida caliente funcional",
    life: "assets/img/life/latte-2.webp",
    focus: "48% 48%",
    lifeAlt: "Taza de Latte Dorato CHOCATA junto al empaque",
    prices: [{ s: "400 g", p: "$35.000" }],
    facts: ["400 g", "≈ 50 porciones", "Dosis 8 g", "6 ingredientes naturales"],
    description: "Mezcla en polvo de quinua, maca, cúrcuma, canela, jengibre y pimienta para preparar bebida caliente. Es la versión andina del golden latte: la cúrcuma pone el color y el perfil antioxidante, la pimienta está ahí por una razón técnica —mejorar la absorción de la curcumina— y la quinua y la maca aportan el cuerpo y el fondo dulce-terroso.",
    benefits: [
      { t: "Rodillas que molestan menos", d: "Un metaanálisis de 15 estudios con 1.670 pacientes con artrosis de rodilla concluye que los curcuminoides logran efecto analgésico y de mejora funcional a corto plazo." },
      { t: "La pimienta no es por sabor", d: "La piperina aumenta de forma marcada la biodisponibilidad de la curcumina: incrementa el flujo sanguíneo intestinal, la permeabilidad del enterocito y frena la enzima que la elimina. Sin pimienta, buena parte de la cúrcuma no se absorbe." },
      { t: "Maca: nutrición de verdad", d: "Aporta entre 8,9 y 11,6 % de proteína, fibra, aminoácidos esenciales, hierro, calcio y zinc, más macamidas y flavonoles asociados en la literatura con actividad antifatiga y antioxidante." },
      { t: "Caliente y sin cafeína", d: "Se puede tomar de noche sin que te quite el sueño, a diferencia del café o el té. Funciona como ritual de cierre del día." }
    ],
    usage: "<strong>8 g (una cucharada) en un vaso de agua, aguapanela, café o jugo de naranja</strong>. También en leche caliente. Tomado en el desayuno o en la mañana aprovecha mejor el efecto energizante de la maca.",
    note: "Si tomas anticoagulantes, tienes cálculos biliares o vas a someterte a cirugía, consulta con tu médico antes de consumir cúrcuma de forma regular.",
    sources: [
      { l: "Curcuminoids alone in alleviating pain and dysfunction for knee osteoarthritis — systematic review and meta-analysis", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9580113/" },
      { l: "Curcumin-piperine co-supplementation and human health — comprehensive review", u: "https://pubmed.ncbi.nlm.nih.gov/36720711/" },
      { l: "Curcumin: a review of its effects on human health", u: "https://pubmed.ncbi.nlm.nih.gov/29065496/" },
      { l: "Exploring the chemical and pharmacological variability of Lepidium meyenii (maca)", u: "https://pubmed.ncbi.nlm.nih.gov/38440178/" }
    ]
  }

};
