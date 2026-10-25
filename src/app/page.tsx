import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Footer, Header } from '@/components/site/site-shell';
import { DoctorPortrait } from '@/components/site/doctor-portrait';
import { articles } from '@/content/articles';
import { treatments as treatmentContent } from '@/content/treatments';

export const metadata: Metadata = {
  title: 'Dr. Douglas Vaz | Psiquiatria',
  description:
    'Psiquiatria com escuta, vínculo e presença. Informação clara, áreas de acompanhamento e acesso seguro à área da paciente.',
};

type IconName =
  | 'arrow'
  | 'book'
  | 'chat'
  | 'check'
  | 'clock'
  | 'focus'
  | 'heart'
  | 'lock'
  | 'refresh'
  | 'shield'
  | 'sparkle'
  | 'user'
  | 'video'
  | 'waves';

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5Z" />
      <path d="M4 19a2 2 0 0 1 2-2h14" />
    </>
  ),
  chat: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 8.5M4 4v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 14 4.5l2-2M20 20v-4.5h-4.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.8c0 4.7 3.1 7.9 7.5 9.2 4.4-1.3 7.5-4.5 7.5-9.2V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkle: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="6" width="13.5" height="12" rx="3" />
      <path d="m16 10 5.5-3v10L16 14" />
    </>
  ),
  waves: <path d="M3 9c2.5-3 5-3 7.5 0s5 3 7.5 0M3 15c2.5-3 5-3 7.5 0s5 3 7.5 0" />,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const highlights: { icon: IconName; title: string; text: string }[] = [
  { icon: 'user', title: 'Escuta individual', text: 'Um espaço dedicado à sua história.' },
  { icon: 'shield', title: 'Sigilo e privacidade', text: 'Cuidado com cada informação.' },
  { icon: 'video', title: 'Consulta online', text: 'Disponibilidade confirmada pela equipe.' },
  { icon: 'refresh', title: 'Acompanhamento contínuo', text: 'Plano revisto ao longo do tempo.' },
];

const pillars: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'chat',
    title: 'Escuta e acolhimento',
    text: 'Um espaço para falar sobre o que você vive, sem pressa e sem julgamentos.',
  },
  {
    icon: 'focus',
    title: 'Avaliação individualizada',
    text: 'Sua história, suas necessidades e suas expectativas orientam a conversa.',
  },
  {
    icon: 'sparkle',
    title: 'Decisões compartilhadas',
    text: 'Informação clara para compreender as possibilidades de cuidado.',
  },
];

const treatmentIcons: IconName[] = ['waves', 'heart', 'focus', 'sparkle'];
const treatments = treatmentContent.map((treatment, index) => ({
  ...treatment,
  icon: treatmentIcons[index],
  index: String(index + 1).padStart(2, '0'),
}));

const steps: { number: string; title: string; text: string }[] = [
  {
    number: '01',
    title: 'Escolha seu atendimento',
    text: 'Conheça as modalidades e entenda o caminho para iniciar o acompanhamento.',
  },
  {
    number: '02',
    title: 'Um espaço para ouvir você',
    text: 'Na primeira consulta, sua história é o ponto de partida para a avaliação.',
  },
  {
    number: '03',
    title: 'Seguimos juntos',
    text: 'Um plano de cuidado individualizado, revisto ao longo do acompanhamento.',
  },
];

const questions: { question: string; answer: string }[] = [
  {
    question: 'Como funciona a primeira consulta?',
    answer:
      'É um momento para conversar sobre sua história, suas necessidades e suas expectativas. A partir da avaliação, o médico discute com você as possibilidades de cuidado.',
  },
  {
    question: 'É possível fazer a consulta online?',
    answer:
      'A modalidade online está prevista na plataforma. Disponibilidade, critérios e requisitos devem ser confirmados com a equipe antes de qualquer atendimento.',
  },
  {
    question: 'Uma consulta significa que vou precisar usar medicação?',
    answer:
      'Não há uma indicação igual para todas as pessoas. As possibilidades de tratamento dependem da avaliação individual e são discutidas com o médico.',
  },
  {
    question: 'Como meus dados são protegidos?',
    answer:
      'A área da paciente é individual e exige login. As páginas públicas não solicitam dados clínicos e a política de privacidade descreve como as informações são tratadas.',
  },
];

const readingList = articles
  .filter(article => article.status === 'PUBLISHED' && article.publishedAt)
  .slice(0, 3);

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content" className="home">
        <section className="home-hero">
          <span className="home-hero-glow home-hero-glow-a" aria-hidden="true" />
          <span className="home-hero-glow home-hero-glow-b" aria-hidden="true" />
          <div className="container home-hero-grid">
            <div className="home-hero-copy">
              <p className="home-pill">
                <span className="home-pill-dot" aria-hidden="true" />
                Psiquiatria com escuta e presença
              </p>
              <h1>
                Cuidado que começa pela sua <em>história.</em>
              </h1>
              <p className="home-hero-lead">
                Um olhar atento para o que você vive. Avaliação individualizada e acompanhamento
                construído com informação clara, vínculo e respeito ao seu tempo.
              </p>
              <div className="home-hero-actions">
                <Link className="home-btn home-btn-primary" href="/agendar">
                  Acessar agendamento <span aria-hidden="true">↗</span>
                </Link>
                <Link className="home-btn home-btn-ghost" href="#como-funciona">
                  Como funciona <Icon name="arrow" />
                </Link>
              </div>
              <ul className="home-hero-points">
                {['Escuta sem julgamento', 'Sigilo e privacidade', 'Consulta online'].map(item => (
                  <li key={item}>
                    <Icon name="check" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="home-hero-visual">
              <span className="home-orbit" aria-hidden="true" />
              <div className="home-portrait-frame">
                <DoctorPortrait />
                <div className="home-portrait-caption">
                  <span>Psiquiatria</span>
                  <strong>Dr. Douglas Vaz</strong>
                  <small>Escuta, vínculo e presença.</small>
                </div>
              </div>
              <div className="home-float home-float-top">
                <span className="home-float-icon">
                  <Icon name="heart" />
                </span>
                <div>
                  <strong>Cada história importa</strong>
                  <span>Um cuidado individualizado.</span>
                </div>
              </div>
              <div className="home-float home-float-bottom">
                <span className="home-float-icon">
                  <Icon name="refresh" />
                </span>
                <div>
                  <strong>Acompanhamento contínuo</strong>
                  <span>Plano revisto com você.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container home-hero-stats">
            {highlights.map(highlight => (
              <div className="home-hero-stat" key={highlight.title}>
                <Icon name={highlight.icon} />
                <div>
                  <strong>{highlight.title}</strong>
                  <span>{highlight.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section" id="cuidado">
          <div className="container">
            <div className="home-section-head">
              <div>
                <p className="home-kicker">Um cuidado para cada momento</p>
                <h2>Compreender é o primeiro passo.</h2>
              </div>
              <p>
                Uma proposta de cuidado que valoriza a escuta, o vínculo e a sua história — com
                informação clara em cada etapa.
              </p>
            </div>
            <div className="home-approach-grid">
              {pillars.map((pillar, index) => (
                <article className="home-pillar" key={pillar.title}>
                  <span className="home-pillar-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="home-pillar-icon">
                    <Icon name={pillar.icon} />
                  </span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </article>
              ))}
            </div>
            <div className="home-approach-note">
              <p>“Cada história merece cuidado.”</p>
              <Link className="home-inline-link" href="/sobre">
                Conhecer o médico <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>


        <section className="home-section home-section-tinted" id="tratamentos">
          <div className="container">
            <div className="home-section-head">
              <div>
                <p className="home-kicker">Áreas de acompanhamento</p>
                <h2>Como posso ajudar você?</h2>
              </div>
              <Link className="home-inline-link" href="/tratamentos">
                Ver todas as áreas <Icon name="arrow" />
              </Link>
            </div>
            <div className="home-treatment-grid">
              {treatments.map(treatment => (
                <Link
                  className="home-treatment-card"
                  key={treatment.slug}
                  href={`/tratamentos/${treatment.slug}`}
                >
                  <div className="home-treatment-top">
                    <span className="home-treatment-index" aria-hidden="true">
                      {treatment.index}
                    </span>
                    <span className="home-treatment-icon">
                      <Icon name={treatment.icon} />
                    </span>
                  </div>
                  <h3>{treatment.title}</h3>
                  <p>{treatment.intro}</p>
                  <span className="home-treatment-link">
                    Conhecer esta área <Icon name="arrow" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="home-treatment-band">
              <div>
                <strong>Não sabe por onde começar?</strong>
                <p>Entenda as modalidades de atendimento e dê o próximo passo com tranquilidade.</p>
              </div>
              <Link className="home-btn home-btn-light" href="/agendar">
                Acessar agendamento <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="home-section" id="sobre">
          <div className="container">
            <div className="home-about">
              <span className="home-about-glow" aria-hidden="true" />
              <div className="home-about-grid">
                <div className="home-about-portrait">
                  <DoctorPortrait variant="about" />
                  <span className="home-about-badge">Cuidado individualizado</span>
                </div>
                <div>
                  <p className="home-kicker home-kicker-light">Sobre o médico</p>
                  <h2>
                    Prazer,
                    <br />
                    Dr. Douglas Vaz.
                  </h2>
                  <p>
                    A proposta deste espaço é aproximar você de um cuidado em saúde mental que
                    valoriza a escuta, o vínculo e a sua história.
                  </p>
                  <p>
                    Informação clara e decisões compartilhadas fazem parte de um acompanhamento
                    atento às necessidades de cada pessoa.
                  </p>
                  <ul className="home-tags">
                    <li>Escuta</li>
                    <li>Vínculo</li>
                    <li>Transparência</li>
                  </ul>
                  <div className="home-about-actions">
                    <Link className="home-btn home-btn-light" href="/sobre">
                      Conhecer o médico <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                  <p className="home-about-note">
                    Biografia, formação e registros profissionais serão publicados após confirmação
                    dos dados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="home-section home-how" id="como-funciona">
          <div className="container home-how-grid">
            <div className="home-how-intro">
              <p className="home-kicker">Do primeiro contato ao acompanhamento</p>
              <h2>Você não precisa dar esse passo sozinho.</h2>
              <p className="home-how-lead">
                Três passos simples para iniciar o acompanhamento com informação e acolhimento.
              </p>
              <div className="home-how-note">
                <span className="home-how-note-icon">
                  <Icon name="lock" />
                </span>
                <div>
                  <strong>Acesso individual e protegido</strong>
                  <p>O agendamento acontece pelo painel. O primeiro acesso é criado pela equipe.</p>
                </div>
              </div>
              <Link className="home-inline-link" href="/painel">
                Acessar painel <Icon name="arrow" />
              </Link>
            </div>
            <ol className="home-steps">
              {steps.map(step => (
                <li className="home-step" key={step.number}>
                  <span className="home-step-marker" aria-hidden="true">
                    {step.number}
                  </span>
                  <div className="home-step-body">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section" id="leituras">
          <div className="container">
            <div className="home-section-head">
              <div>
                <p className="home-kicker">Informação também é cuidado</p>
                <h2>Leituras para o seu próximo passo.</h2>
              </div>
              <Link className="home-inline-link" href="/blog">
                Explorar o blog <Icon name="arrow" />
              </Link>
            </div>
            <div className="home-articles">
              {readingList.map(article => (
                <Link className="home-article" key={article.slug} href={`/blog/${article.slug}`}>
                  <div className="home-article-meta">
                    <span>{article.category}</span>
                    <span>{article.readingMinutes} min de leitura</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <span className="home-article-link">
                    Ler artigo <Icon name="arrow" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>


        <section className="home-section home-section-tinted" id="duvidas">
          <div className="container home-faq-grid">
            <div className="home-faq-intro">
              <p className="home-kicker">Perguntas frequentes</p>
              <h2>Vamos esclarecer suas dúvidas.</h2>
              <p className="home-faq-lead">
                Informação para dar o próximo passo com mais tranquilidade.
              </p>
              <div className="home-faq-contact">
                <span>Ainda tem perguntas?</span>
                <p>Fale com a equipe para conhecer as opções de atendimento.</p>
                <Link className="home-inline-link home-inline-link-light" href="/contato">
                  Falar com a equipe <Icon name="arrow" />
                </Link>
              </div>
              <p className="home-emergency">
                Este site não é um canal de emergência. Em risco imediato, procure um serviço de
                urgência ou acione o SAMU pelo 192. Para apoio emocional, o CVV atende pelo 188.
              </p>
            </div>
            <div className="home-faq-list">
              {questions.map(question => (
                <details className="home-faq-item" key={question.question}>
                  <summary>
                    {question.question}
                    <span className="home-faq-icon" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{question.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="home-cta">
          <div className="container">
            <div className="home-cta-card">
              <span className="home-cta-glow" aria-hidden="true" />
              <div>
                <p className="home-kicker home-kicker-light">Um tempo para você</p>
                <h2>O cuidado começa com uma conversa.</h2>
                <p>Conheça as opções de atendimento e os próximos passos, no seu tempo.</p>
                <div className="home-cta-actions">
                  <Link className="home-btn home-btn-primary" href="/agendar">
                    Acessar agendamento <span aria-hidden="true">↗</span>
                  </Link>
                  <Link className="home-btn home-btn-ghost" href="/contato">
                    Falar com a equipe <Icon name="arrow" />
                  </Link>
                </div>
              </div>
              <ul className="home-cta-points">
                <li>
                  <Icon name="check" /> Escuta e acolhimento
                </li>
                <li>
                  <Icon name="check" /> Sigilo e privacidade
                </li>
                <li>
                  <Icon name="check" /> Informação clara
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

