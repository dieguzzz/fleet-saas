export type DogState =
  | 'idle' | 'walking' | 'running' | 'sitting' | 'barking'
  | 'licking' | 'itching' | 'stretching' | 'lying-down' | 'sleeping';

export type DogBreed =
  | 'Dog-1-Golden-Retriever' | 'Dog-2-Akita' | 'Dog-3-Great-Dane'
  | 'Dog-4-Schnauzer' | 'Dog-5-Saint-Bernard' | 'Dog-6-Siberian-Husky';

export interface DogAction { name: DogState; frames: number; width: number; duration: string; }
export interface DogConfig { folder: string; prefix: string; idleCase: 'idle' | 'Idle'; }

export const STATE_TO_FILE: Record<DogState, string> = {
  idle: 'idle', walking: 'walk', running: 'run', sitting: 'sitting', barking: 'bark',
  licking: 'licking1', itching: 'itching', stretching: 'stretching',
  'lying-down': 'lying-down', sleeping: 'sleeping',
};

export const ACTIONS: DogAction[] = [
  { name: 'idle',       frames: 10, width: 1000, duration: '1.2s'  },
  { name: 'walking',    frames: 8,  width: 800,  duration: '0.6s'  },
  { name: 'running',    frames: 8,  width: 800,  duration: '0.35s' },
  { name: 'sitting',    frames: 1,  width: 100,  duration: '0s'    },
  { name: 'barking',    frames: 3,  width: 300,  duration: '0.6s'  },
  { name: 'licking',    frames: 4,  width: 400,  duration: '0.7s'  },
  { name: 'itching',    frames: 2,  width: 200,  duration: '0.8s'  },
  { name: 'stretching', frames: 10, width: 1000, duration: '1.2s'  },
  { name: 'lying-down', frames: 7,  width: 700,  duration: '1.0s'  },
  { name: 'sleeping',   frames: 1,  width: 100,  duration: '0s'    },
];

export const BREEDS: Record<DogBreed, DogConfig> = {
  'Dog-1-Golden-Retriever': { folder: 'Dog-1-Golden-Retriever', prefix: 'Golden-Retriever-', idleCase: 'idle' },
  'Dog-2-Akita':            { folder: 'Dog-2-Akita',            prefix: 'Akita-',            idleCase: 'Idle' },
  'Dog-3-Great-Dane':       { folder: 'Dog-3-Great-Dane',       prefix: 'Great-Dane-',       idleCase: 'idle' },
  'Dog-4-Schnauzer':        { folder: 'Dog-4-Schnauzer',        prefix: 'Schnauzer-',        idleCase: 'Idle' },
  'Dog-5-Saint-Bernard':    { folder: 'Dog-5-Saint-Bernard',    prefix: 'Saint-Bernard-',    idleCase: 'Idle' },
  'Dog-6-Siberian-Husky':   { folder: 'Dog-6-Siberian-Husky',  prefix: 'Siberian-Husky-',   idleCase: 'Idle' },
};

export const MSGS: Record<string, string[]> = {
  idle:         ['...', '👀', 'Husmeando~', '*bostezo*', '¿Hay snacks?', 'Hmm...', '🐾', '¿Dónde está mi pelota?', 'Todo tranquilo~', '*olisquea el aire*', 'Relajado~', '¿Y eso?', '*mira al horizonte*', '¡Black Dog! 🐾', '¡Tamos! 💪', '¡Epale~', '¡Qué vacano!'],
  walking:      ['Patrullando 🐕', 'Inspeccionando...', 'A ver qué hay~', '¡Al rescate!', '¡Voy voy!', 'Dando vueltas~', '¡Explorador oficial!', '*misión importante*', '¡Black Dog finest! 🐕', '¡Dale que vamos!', 'Ronda de inspección~'],
  running:      ['¡A toda velocidad! 💨', '*corre corre*', '¡Turbo activado!', '¡YA VOOOY!', '💨 *whoosh*', '¡Black Dog SPEED! 🔥', '¡Vamo a darle!'],
  barking:      ['¡Woof! 🗣️', '¡AU AU!', '¡GUAU GUAU!', '¡EH TÚ!', '¡Hola amigo!', '¡Woof woof!', '¡¡ALERTA!!', 'WOOF WOOF WOOF', '¡¡EPALE!!', '¡¡OYE!!'],
  licking:      ['*se limpia* 🐾', '*muy higiénico*', 'Mmm~', '¡Me arreglo solo!', '*lame la pata*', 'Qué rico~', '*spa time*', '¡Pura higiene!'],
  itching:      ['Ahhhh... 😌', '*rasca rasca*', 'Qué rico~', 'Ahhh justo ahí~', 'Mmm sí~', '¡Por fin!', '*rasca rasca rasca*'],
  stretching:   ['*se estira* 🙆', 'Aaah~', 'Listooo~', '¡Buenos días!', '*crack* ¡Ajá!', 'Qué rico~', '¡Recargado!', '¡Listo pa´ lo que sea!'],
  sitting:      ['👀', '¿Me llamaste?', 'Aquí sentadito~', 'A sus órdenes 🐕', 'Esperando~', '*mira fijamente*', 'Soy bueno~', '¡Atento!'],
  'lying-down': ['Creo que descansaré...', 'Uf qué día...', '*se acomoda*', 'Solo un momento~', '*suspiro*', 'Modo relax~', '¡Qué bulla tan rica!'],
  sleeping:     ['Zzz...', '💤', 'Zzz 🐾', '*ronca suavecito*', 'Zzzz~', '*sueña con salchichas*', '💤💤', '*sueña con Black Dog*'],
  zoomies:      ['¡¡ZOOMIES!! 🚀', '¡WOO HOO!', '¡AGÁRRAME!', '¡YAAAS!', '💨💨💨', '¡GO GO GO!', '¡¡SPEED!!', '¡YUJU!', '¡¡IMPARABLE!!', '¡¡FULL ENVUELTO!!'],
  wake:         ['¡Wuh?! 😲', '*despierta*', '¿Ehh? ¿Me llamaste?', '¡Ya estoy! 🐕', '*parpadea*', '¿dormí mucho?', '¡Presente!'],
  pet:          ['❤️ Gracias~', '¡Más! ¡Más!', 'Qué buena onda 🥰', '*mueve la cola*', '¡Te quiero!', '🐾❤️', 'Aww~', '¡Qué vacano~!'],
  poop:         ['💩 Privacidad pls', 'No mires 😳', '...fue el otro perro', '*mirada inocente*', 'Ejem...', '¡Disculpen!'],
  pee:          ['💦 un momento...', '*hace pipí*', 'Territorio marcado ✅', '¡Mío mío mío!', 'Disculpen~', '¡Área asegurada!'],
  grumpy:       ['😤 Déjame.', '¡HOY NO!', '*gruñido*', '😠 ...', 'No estoy de humor', '¡MOLESTO!', 'GRR...', '¡SUFICIENTE!', '*cara de pocos amigos*', '¡Qué broma!'],
  grumpy_pet:   ['¡NO ME TOQUES! 😤', '*gruñido bajo*', '¡ALÉJATE!', '😠 En serio.', '¡GRR!', 'HOY NO.', '¡RETÍRATE!'],
  sneeze:       ['¡ACHÍS! 🤧', '*achú*', '¡Salud yo mismo!', '🤧 uf...', '¡ATCHOO!'],
  howl:         ['¡Auuuuuu! 🌙', '*aullido nocturno*', '¡AUUUU!', '🐺 Auuu~', '¡AWOOOOO!', '¡¡LUNA LLENA!! 🌕'],
  chase:        ['*persigue la cola*', '¡La agarré! Espera...', '¡Casi casi!', '*gira y gira*', '¡Es mía!'],
  hungry:       ['¿Snacks? 🦴', '*ruido de barriga*', '¿Hay comida?', '¡Tengo hambre! 🍖', '¿Pancito? 🥺', '¡¿Y el perro?! 🐾'],
  snack: [
    '¿Alguien dijo treats? 👀🦴', '¡Yo quiero un treat! 🦴', '*olfatea el aire* ...¿treats?',
    '¡Dame un snack o no marco! 🐾🦴', '¡Motivación = treat! 💡🦴',
    '¡Necesito mi Greatness! 🌿🐕', '¡Greatness para desayuno, almuerzo y cena! 🌿',
    '*sueña con Greatness natural* 🌿😴', '¡Greatness: la comida que merezco! 👑🌿',
    '¡Sin Greatness no hay energía! 🌿⚡', '¡Comida natural = vida larga! 🌿❤️',
    '¡Greatness > croquetas normales! 🌿💪', '¡Black Dog tiene lo mejor: Greatness! 🌿🐾',
    '¡PATAS DE POLLO! 🍗😍', '¡Una patita de pollo por favor! 🍗🥺',
    '*babea pensando en patas de pollo* 🍗', '¡Las patas de pollo son la vida! 🍗💕',
    '¿Hay patas de pollo en bodega? 👀🍗', '¡Patas de pollo: el snack 10/10! 🍗🏆',
    '¡Patas de pollo > todo lo demás! 🍗', '*corre hacia las patas de pollo* 🍗💨',
    '¡Quiero mi Traque! 🦷💪', '¡Traque para los dientes! 🦷✨',
    '*mastica Traque felizmente* 🦷😌', '¡Traque: snack + limpieza dental! 🦷🐾',
    '¡Dame un Traque! 🦷🥺', '¡El Traque es vida! 🦷❤️',
    '¡OREJA DE CERDO! 🐷😍', '¡Oreja de cerdo = felicidad pura! 🐷💕',
    '*sueña con oreja de cerdo* 🐷💭', '¡Una orejita por favor! 🐷🥺',
    '¡Oreja de cerdo: el lujo supremo! 🐷👑', '¡No me hablen hasta que tenga mi oreja! 🐷😤',
    '*olfatea la oreja de cerdo desde lejos* 🐷👃',
    '¡Pata de pollo + Traque + oreja = el combo perfecto! 🍗🦷🐷',
    '¡Black Dog tiene los mejores snacks! 🦴🐾', '¡Primero el Greatness, después trabajo! 🌿💼',
    '¡Snack ahora o huelga! ✊🦴',
  ],
  confused:     ['¿Qué? 🤔', '*cabecita ladeada*', 'No entiendo...', '¿Ehh?', '*orejas alzadas*', '¿Eso es normal?'],
  excited:      ['¡¡SIIIII!! 🎉', '¡WOW WOW!', '¡¡YAY!!', '¡¡AMOR!!', '🎊🐕🎊', '¡¡FELIZ!!', '¡¡FULL HYPE!!'],
  jump:         ['¡WHEEE! 🦘', '¡SALTOOO!', '¡Soy libre!', '¡¡BOING!!', '¡Miren qué salto!', '¡¡YAAAS!!', '¡SKY HIGH!'],
  superman:     ['¡¡SOY SUPERDOGGO!! 🦸', '¡AL INFINITO!', '💨 SWOOOOSH', '¡¡VUELOOO!!', 'Es un pájaro... es un avión... ¡soy yo!', '¡¡BLACK DOG VUELA!!'],
  dig:          ['*excava* 🐾', '¡Sé que está aquí!', 'Está en algún lado...', '¡¡TESORO!!', '*excava frenéticamente*', '¡¡Lo encontré!!'],
  roll:         ['*rueda rueda* 🔄', '¡Voltearseee!', 'Miren esto~', '¡Truco nuevo!', '*se revuelca*'],
  typing:       ['¿Escribiendo? 👀', '*mira la pantalla*', '¿Qué haces?', '¡Estoy aquí también!', '*muy atento*', '¿Me hablas a mí?', 'Clac clac clac...', '¡Yo también sé escribir! ...casi'],
  aprilFools:   ['¡Inocente! 😜', '*fingió dormirse*', '¡Sorpresa! 🎉', '¡HA! ¡Te engañé!', '¡Día de los Inocentes! 🃏', '*era broma*', '¡Jijiji! 😏'],
  monday:       ['Lunes... 😩', '*suspiro de lunes*', 'Ya es lunes otra vez.', 'No me hablen.', '¿Por qué no es viernes?', 'El lunes es trampa.'],
  friday:       ['¡¡VIERNESSS!! 🎉', '¡TGIF! 🐕', '¡Llegó el viernes!', '¡¡FINDE!! 🥳', '¡¡SÍ SÍ SÍ!! Viernes~', '¡¡BLACK DOG FINDE!!'],
  hyper:        ['¡¡¡HIPERACTIVO!!! 🤪', '¡¡¡NO PUEDO PARAR!!!', '¡¡¡ENERGÍAAA!!!', '💥💥💥', '¡¡¡WOOOOO!!!', '¡¡MAXIMO HYPE!!', '¡¡¡YO SOY EL CAOS!!!', '¡¡¡FULL PALO!!!'],
  hyperDone:    ['*jadeando*', 'Uf... uf...', 'Necesito... agua...', '*colapsa*', '...valió la pena 😌', 'Uff 💀', '*sin aliento*', '...eso estuvo bueno'],
  sexy:         ['😘 muak~', '💋', '*guiño guiño* 😉', '¡Woof~ ❤️', '*coqueto*', '💕 hola~', '¡Qué rico~', '*ojos de cachorro* 🥺', '¿Me buscabas? 😏', '¡Woof bonito!'],
  drag:         ['¡Ey! ¡Me agarraron! 😅', '*resiste heroicamente*', '¡No tan fuerte!', 'Umm... ok~', '*curioso*', '¿A dónde vamos?'],
  drop:         ['¡Uf! Me soltaron~', '*sacude el polvo*', '¡Qué paseo!', 'Eso fue raro... 😅', '*recupera la dignidad*', '¡Bien! ¡Ya llegué!'],
  trophy:       ['¡¡CAMPEÓN!! 🏆', '¡Miren mi trofeo!', '¡El mejor perro! 🏆', '¡GANAMOS! 🎉', '¡Black Dog #1! 🏆'],
  dance:        ['🎵 *bop bop*', '¡Que suene! 🎶', '*mueve el esqueleto*', '🎵 woof woof~', '¡DJ Black Dog! 🎧', '¡A bailar!', '*disco mode*'],
  chase_mouse:  ['¡A ese mouse! 💨', '¡Lo tengo!', '¡Atrápalo!', '¡CORRE!', '¡¡PERSECUCIÓN!!', '¡No te me vas!'],
  konami:       ['¡¡¡MODO DIOS ACTIVADO!!! ✨', '¡¡BLACK DOG ULTRA!!', '¡¡¡CHEAT CODE!!!', '💥🐕💥', '¡¡¡NIVEL 99!!!'],
  blackdog:     ['¡Black Dog gang! 🐾', '¡Tamos! 💪', '¡Dale que vamos!', '¡Epale~', '¡Qué vacano!', '¡Tá bueno! 🔥', '¡Pura bulla!', '¡Vamo a darle!', '¡Black Dog finest! 🐕‍🦺', '¡Somo los mejores!', '¡Black Dog family! 🖤', '¡Full equipo!'],
};

export const BREED_MSGS: Partial<Record<DogBreed, Partial<Record<string, string[]>>>> = {
  'Dog-1-Golden-Retriever': {
    idle:     ['¡Hola! ¡Hola! 🎾', '¿Jugamos?', '¡Te quiero muchísimo~', '¡Eres el mejor!', '¡Qué día tan lindo!', '¡Todo es maravilloso!'],
    walking:  ['¡Voy a exploraaaar!', '¡Qué aventura!', '¿Y si corro?', '¡Mira todo esto!', '¡Mejor día ever!'],
    running:  ['¡¡WOOOOO!!', '¡Soy el más rápido! 🎾', '¡YAAAAS!', '¡VÉANme CORREERR!'],
    barking:  ['¡¡AMIGO!!', '¡Hola hola HOLA!', '¡Woof! ¡Soy feliz!', '¡¡YAAAY!!', '¡¡TE VEO!!'],
    licking:  ['*muy limpiito* ✨', '¡Brillante como el sol!', '¡Guapo y limpio!'],
    pet:      ['¡¡SÍIIII!!', '¡Más más más!', '¡¡TE AMO!!', '*coletazo intenso*', '¡¡MEJOR DÍA!!'],
    sexy:     ['¡¡AMOR!!! 😘', '¡Soy el más bonito! 💛', '*cola full velocidad*'],
    grumpy:   ['Intenté enojarme... 😅', '¡Bueno te perdono!', '¿Abrazos?', '*difícil estar enojado*'],
    jump:     ['¡¡WEEEEE!!', '¡Puedo volar casi!', '¡¡TAM TAM TAM!!'],
    friday:   ['¡¡EL MEJOR DÍA!! 🎾🎉', '¡Viernesss y yo! 🐕💛'],
    blackdog: ['¡Golden Dog gang! 🎾🐾', '¡Pura felicidad y Black Dog!'],
  },
  'Dog-2-Akita': {
    idle:     ['...', '*honor y dignidad*', 'Vigilando.', 'Todo en orden.', 'Perfecto.'],
    walking:  ['Ronda de vigilancia.', 'Inspeccionando el perímetro.', 'Todo en orden.'],
    running:  ['Velocidad con honor.', '*corre con dignidad*', 'Sprint calculado.'],
    barking:  ['¡ALTO!', '¿Quién anda ahí?', '¡Identifícate!', 'Intruso detectado.'],
    licking:  ['*higiene impecable*', 'Limpieza ritual.', 'Honor y aseo.'],
    pet:      ['...aceptable.', '*dignidad intacta*', 'Mmh.', 'Honor concedido.'],
    sexy:     ['...interesante.', '*levanta una ceja*', 'Procede con gracia.'],
    grumpy:   ['Falta el respeto.', '*mirada penetrante*', 'Inaceptable.'],
    howl:     ['¡Auuuu! (con honor)', '*aullido ceremonial*', 'Saludo a la luna.'],
    blackdog: ['Black Dog. Con honor.', 'Honor al equipo.'],
  },
  'Dog-3-Great-Dane': {
    idle:     ['¿Subo al regazo? 🥺', '*choca con algo*', 'Soy pequeñito~', 'No soy tan grande~'],
    walking:  ['*roza con las paredes*', 'Con cuiiidado~', '*derriba algo de paso*'],
    running:  ['*TERREMOTO EN CURSO* 🌍', '*todo tiembla a su paso*', '¡CUIDADO QUE VENGO!'],
    barking:  ['¡¡¡WOOF!!! (el suelo tiembla)', '¡¡HOLA!! (muy fuerte)', '¿Muy alto? Perdón~'],
    pet:      ['*casi te tumba de amor*', '¡¡YAY!! (rompe algo)', '*coletazo demoledor*'],
    sexy:     ['*tropiezo seductor*', '¡Soy grande pero tierno! 🥺', '*casi rompe algo coqueteando*'],
    grumpy:   ['*rompe algo sin querer*', '¡Oops! No fui yo~'],
    blackdog: ['¡Black Dog GRANDE! 💪', '*sacude el edificio de emoción*'],
  },
  'Dog-4-Schnauzer': {
    idle:     ['Yo mando aquí.', '*inspecciona todo*', 'Tengo reglas.', '¡Atención!'],
    walking:  ['Patrulla oficial.', 'Verificando el área.', 'Todo bajo control.'],
    running:  ['¡ACCIÓN REGLAMENTARIA!', '¡Sprint autorizado!'],
    barking:  ['¡OYE TÚ!', '¡A MIS ÓRDENES!', '¡AQUÍ MANDO YO!', '¡REGLAS!'],
    licking:  ['*limpieza conforme al reglamento*', 'Aseo: aprobado.'],
    pet:      ['Está... permitido.', 'Una vez.', 'Solo por hoy.'],
    sexy:     ['Esto... no estaba en el reglamento.', '*acepta coqueteo previo protocolo*'],
    grumpy:   ['¡INACEPTABLE!', '¡Mi territorio!', '¡ORDEN!'],
    dig:      ['¡Aquí está la evidencia!', '*excava con autoridad*'],
    blackdog: ['Black Dog bajo reglamento. 📋', '¡Protocolo Black Dog activado!'],
  },
  'Dog-5-Saint-Bernard': {
    idle:     ['¿Necesitas rescate? 🛡️', 'Aquí para ayudar~', 'Listo para la misión.'],
    walking:  ['Buscando quién necesite ayuda~', '¡A ayudar!', 'Patrulla de rescate.'],
    running:  ['¡¡EMERGENCIA EN CAMINO!!', '¡RESCATE VELOZ! 🛡️'],
    barking:  ['¡AL RESCATE!', '¡EMERGENCIA!', '¡MISIÓN ACTIVADA!'],
    licking:  ['*lame de rescate*', 'Primeros auxilios de lamida~'],
    pet:      ['*te salva aunque no lo necesites*', 'Misión cumplida~', '¡Estás a salvo!'],
    sexy:     ['*te rescata y encima coquetea*', '¡Salvo corazones también! 💕'],
    superman: ['¡SUPERBERNARDO AL RESCATE! 🦸', '¡VUELO DE RESCATE!'],
    blackdog: ['¡Black Dog Rescue Team! 🛡️🐾', '¡Salvando con estilo!'],
  },
  'Dog-6-Siberian-Husky': {
    idle:     ['*llanto dramático*', 'Nadie me entiende~', 'La vida es dura 😤', '¡WOOOO!'],
    walking:  ['*dramático suspiro al caminar*', 'Nadie aprecia el esfuerzo.', 'Caminando en mi tragedia~'],
    running:  ['¡¡HUYENDO DE MI DESTINO!!', '*corre dramáticamente*'],
    barking:  ['¡AWOOOO!', '¡¡ESCÚCHENME!!', '¡WOO WOO WOO!'],
    licking:  ['*lame con drama*', 'Limpiándome mis lágrimas~'],
    pet:      ['*acepta dramáticamente*', '¡¡AWOOOO! (feliz)', 'Quizás no me abandonaste.'],
    sexy:     ['*coquetea dramáticamente*', '¡Auuuu de amor! 😭❤️', 'Quizás sí te merezca...'],
    grumpy:   ['¡¡TRAICIÓN!!', '*drama máximo*', '¡¡NUNCA LO PERDONARÉ!!'],
    howl:     ['¡¡AUUUUUUUU!! 🌕', '*aullido de 10 minutos*', '¡MI VIDA ES UNA ÓPERA!'],
    monday:   ['EL. PEOR. DÍA. 😭', '*llora en lunes*'],
    friday:   ['¡¡SOBREVIVÍ A LA SEMANA!! 😭🎉', '*llora de alegría*'],
    blackdog: ['¡Black Dog es mi familia! 😭❤️', '*llora de orgullo por Black Dog*'],
  },
};

export function isFullMoon(): boolean {
  const known = new Date(2024, 0, 25).getTime();
  const msPerCycle = 29.53059 * 24 * 3600 * 1000;
  const diff = (Date.now() - known) % msPerCycle;
  const phase = diff / msPerCycle;
  return phase > 0.45 && phase < 0.55;
}
