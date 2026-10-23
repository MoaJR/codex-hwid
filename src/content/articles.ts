export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
  editorialLabel: string;
  reviewNotice: string;
  blocks: ArticleBlock[];
};

const editorialLabel = 'Conteúdo de demonstração';
const reviewNotice = 'Texto educativo de demonstração, ainda sujeito a revisão clínica. Não substitui uma avaliação individual.';

export const articles: Article[] = [
  {
    slug: 'como-se-preparar-para-a-primeira-consulta',
    title: 'Como se preparar para a primeira consulta',
    excerpt: 'Algumas anotações e informações podem ajudar você a organizar o que gostaria de conversar.',
    category: 'Primeira consulta',
    readingMinutes: 2,
    status: 'PUBLISHED',
    publishedAt: '2026-10-23',
    editorialLabel,
    reviewNotice,
    blocks: [
      { type: 'paragraph', text: 'A primeira consulta é uma oportunidade de apresentar sua história e falar sobre o que motivou a busca por atendimento. Você não precisa chegar com todas as respostas nem preparar um relato perfeito.' },
      { type: 'heading', text: 'O que você gostaria de conversar?' },
      { type: 'paragraph', text: 'Se ajudar, anote situações que têm sido difíceis, dúvidas que gostaria de esclarecer e o que espera do acompanhamento. Você pode levar essas anotações e escolher por onde começar a conversa.' },
      { type: 'heading', text: 'Informações para organizar antes do encontro' },
      { type: 'list', items: ['Confirme com a equipe a data, o horário, a modalidade e os documentos necessários.', 'Se utiliza medicamentos, leve a lista com os nomes e as orientações que recebeu.', 'Separe exames ou relatórios anteriores que considere relevantes, se estiverem disponíveis.', 'Anote suas dúvidas sobre o atendimento e os próximos passos.'] },
      { type: 'heading', text: 'Respeite seu tempo' },
      { type: 'paragraph', text: 'Pode ser difícil falar sobre algumas experiências. Você pode dizer quando precisar de uma pausa ou de uma explicação mais clara. A conversa também é um momento para compreender como o atendimento será organizado.' },
    ],
  },
  {
    slug: 'consulta-online-com-privacidade',
    title: 'Um espaço reservado para a consulta online',
    excerpt: 'Veja cuidados práticos com o ambiente, a conexão e a privacidade antes de um atendimento por vídeo.',
    category: 'Consulta online',
    readingMinutes: 2,
    status: 'PUBLISHED',
    publishedAt: '2026-10-23',
    editorialLabel,
    reviewNotice,
    blocks: [
      { type: 'paragraph', text: 'Em um atendimento online, preparar o espaço pode facilitar a conversa. Antes de agendar, confirme com a equipe a disponibilidade da modalidade, seus requisitos e as orientações de acesso.' },
      { type: 'heading', text: 'Escolha um lugar onde possa conversar' },
      { type: 'paragraph', text: 'Procure um ambiente tranquilo e reservado. Se outras pessoas estiverem por perto, considere como evitar interrupções e conversas ouvidas sem sua autorização. Fones de ouvido podem ajudar, mas não garantem privacidade por si só.' },
      { type: 'heading', text: 'Confira o acesso antes do horário' },
      { type: 'list', items: ['Teste a conexão, a câmera e o microfone no dispositivo que pretende utilizar.', 'Verifique a carga da bateria ou mantenha um carregador por perto.', 'Feche notificações e aplicativos que possam interromper a conversa.', 'Confirme com a equipe o que fazer se a conexão cair e guarde o canal de contato informado.'] },
      { type: 'heading', text: 'Cuide dos links e documentos' },
      { type: 'paragraph', text: 'Use os canais confirmados pela equipe e evite compartilhar links de atendimento com outras pessoas. Antes de enviar documentos, confira o destinatário e peça orientação sobre o canal apropriado. Esta demonstração ainda não oferece atendimento por vídeo nem envio de documentos reais.' },
    ],
  },
  {
    slug: 'entender-o-acompanhamento',
    title: 'Entender o acompanhamento: espaço para perguntas',
    excerpt: 'Informação clara e participação na conversa ajudam você a compreender os próximos passos do cuidado.',
    category: 'Acompanhamento',
    readingMinutes: 2,
    status: 'PUBLISHED',
    publishedAt: '2026-10-23',
    editorialLabel,
    reviewNotice,
    blocks: [
      { type: 'paragraph', text: 'O acompanhamento é construído a partir da avaliação individual e das conversas com o profissional. Objetivos, orientações e próximos encontros devem ser discutidos de forma que você consiga compreender o que foi combinado.' },
      { type: 'heading', text: 'Perguntas fazem parte do cuidado' },
      { type: 'list', items: ['Quais são os objetivos que estamos discutindo neste momento?', 'Quais possibilidades de cuidado estão sendo consideradas?', 'Como devo me preparar para o próximo encontro?', 'Qual canal devo usar para dúvidas administrativas entre as consultas?'] },
      { type: 'heading', text: 'Organize suas percepções sem se cobrar' },
      { type: 'paragraph', text: 'Caso faça sentido para você e para o profissional, anotações simples sobre o cotidiano podem ajudar na conversa seguinte. Um registro isolado ou um gráfico não estabelece diagnóstico e precisa ser compreendido no contexto da sua história.' },
      { type: 'heading', text: 'Combine os próximos passos' },
      { type: 'paragraph', text: 'Ao final do encontro, peça esclarecimentos se alguma orientação não estiver clara. Se houver medicação prescrita e surgirem dúvidas, procure o profissional responsável antes de fazer mudanças por conta própria. Os canais e os prazos de resposta da equipe também devem ser confirmados.' },
      { type: 'paragraph', text: 'Mensagens administrativas e esta plataforma de demonstração não oferecem atendimento de emergência. Em uma situação de risco imediato, procure um serviço de urgência.' },
    ],
  },
  {
    slug: 'rascunho-interno-nao-publicar',
    title: 'Rascunho interno: organização editorial',
    excerpt: 'Registro interno usado para verificar a separação entre rascunhos e conteúdo público.',
    category: 'Editorial',
    readingMinutes: 1,
    status: 'DRAFT',
    editorialLabel,
    reviewNotice: 'Rascunho editorial interno. Não deve aparecer nas páginas públicas.',
    blocks: [{ type: 'paragraph', text: 'Este rascunho não contém conteúdo clínico e existe somente para verificar o filtro de publicação.' }],
  },
];
