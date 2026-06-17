import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function AboutPage() {
  const { lang } = useLanguage();

  const timeline = [
    { year: '2020', degree: 'Diplôme Supérieur en Expertise Comptable', school: 'ISCAE — Casablanca' },
    { year: '2015', degree: 'Master en Audit et Contrôle de Gestion', school: 'Université Hassan II — Casablanca' },
    { year: '2012', degree: 'Licence en Sciences de Gestion', school: 'Université Hassan II — Casablanca' },
    { year: '2009', degree: 'Baccalauréat Sciences Économiques', school: 'Lycée Lyautey — Casablanca' },
  ];

  const skills = [
    'Expertise Comptable', 'Audit Légal', 'Commissariat aux Comptes',
    'Fiscalité Marocaine', 'Droit des Sociétés', 'Consolidation',
    'Normes IFRS', 'Comptabilité Analytique', 'Gestion de Trésorerie',
    'Due Diligence', 'Évaluation d\'Entreprises', 'Sage 1000',
    'Darija Compta', 'Ciel Compta', 'Excel Avancé',
  ];

  const languages = [
    { name: t('about.arabic', lang), level: 'C2' },
    { name: t('about.french', lang), level: 'C2' },
    { name: t('about.english', lang), level: 'B2' },
  ];

  return (
    <div className="about-shell">
      <div className="about-hero">
        <div className="about-photo">MA</div>
        <div className="about-name">Mustapha Atiq</div>
        <div className="about-title">Expert-Comptable · Commissaire aux Comptes</div>
        <div className="about-contact">
          <div className="about-contact-item"><Mail size={14} /> expert@cabinet-laatig.ma</div>
          <div className="about-contact-item"><Phone size={14} /> +212 5XX XX XX XX</div>
          <div className="about-contact-item"><MapPin size={14} /> Casablanca, Maroc</div>
        </div>
        <div className="page-gold-rule" style={{ margin: '20px auto' }} />
      </div>

      <div className="about-bio" dangerouslySetInnerHTML={{ __html: t('about.bio', lang) }} />

      <div className="about-grid">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('about.education', lang)}</span>
          </div>
          <div className="panel-body">
            <div className="timeline">
              {timeline.map((item) => (
                <div key={item.year} className="timeline-item">
                  <div className="timeline-year">{item.year}</div>
                  <div className="timeline-degree">{item.degree}</div>
                  <div className="timeline-school">{item.school}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{t('about.skills', lang)}</span>
            </div>
            <div className="panel-body">
              <div className="skills-grid">
                {skills.map((skill) => (
                  <span key={skill} className="skill-pill">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{t('about.languages', lang)}</span>
            </div>
            <div className="panel-body">
              {languages.map((langItem) => (
                <div key={langItem.name} className="language-item">
                  <span className="language-name">{langItem.name}</span>
                  <span className="language-level">{langItem.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="about-quote">{t('about.quote', lang)}</div>
    </div>
  );
}
