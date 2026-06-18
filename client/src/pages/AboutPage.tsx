import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

export default function AboutPage() {
  const { lang } = useLanguage();

  const timeline = [
    { degree: 'Master — Comptabilité, Contrôle et Audit (CCA)', school: 'Université Ibn Zohr — FSJES, Agadir' },
    { degree: 'Licence — Comptabilité, Contrôle et Audit (CCA)', school: 'Université Ibn Zohr, Agadir' },
    { degree: 'DUT — Gestion des Entreprises et des Administrations', school: 'Université Ibn Zohr — IUT, Agadir' },
    { degree: 'Baccalauréat — Sciences Comptables', school: 'Agadir, Maroc' },
  ];

  const skills = [
    'Sage', 'Ciel', 'EBP', 'Odoo', 'CaseWare', 'IDEA', 'Excel Avancé', 'Power BI',
  ];

  const languages = [
    { key: 'arabic', flag: '🇲🇦' },
    { key: 'french', flag: '🇫🇷' },
    { key: 'english', flag: '🇬🇧' },
    { name: 'Espagnol', level: 'Intermédiaire', flag: '🇪🇸' },
  ];

  return (
      <div className="about-shell">
      <div className="page-header">
        <h1 className="page-title">{t('about.title', lang)}</h1>
        <div className="page-gold-rule" />
      </div>

      <div className="about-grid">
        <div>
          <div className="about-photo">MA</div>
          <div className="about-name">Mustapha Atiq</div>
          <div className="about-role">Expert-Comptable & Auditeur</div>

          <div style={{ marginTop: 20 }}>
            <div className="contact-item">
              <MapPin size={14} style={{ color: 'var(--cl-gold-dim)' }} />
              <span>Agadir, Maroc</span>
            </div>
            <div className="contact-item">
              <Mail size={14} style={{ color: 'var(--cl-gold-dim)' }} />
              <span>contact@cabinetlaatig.ma</span>
            </div>
            <div className="contact-item">
              <Phone size={14} style={{ color: 'var(--cl-gold-dim)' }} />
              <span>+212 528 000 000</span>
            </div>
            <div className="contact-item">
              <Globe size={14} style={{ color: 'var(--cl-gold-dim)' }} />
              <span>www.cabinetlaatig.ma</span>
            </div>
          </div>
        </div>

        <div>
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-title">{t('about.title', lang)}</div>
            <p style={{ fontSize: 13, color: 'var(--cl-text-secondary)', lineHeight: 1.8 }}>
              Mustapha Atiq est un expert-comptable et auditeur marocain spécialisé en audit financier,
              contrôle de gestion et technologies financières. Diplômé de l'Université Ibn Zohr d'Agadir,
              il maîtrise les normes comptables du CGNC et les pratiques d'audit conformes aux standards
              de l'Ordre des Experts Comptables du Maroc (OEC). Il combine expertise humaine et intelligence
              artificielle pour offrir à ses clients des missions d'audit et de comptabilité d'une précision
              et d'une efficacité inégalées.
            </p>
          </div>

          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-title">{t('about.education', lang)}</div>
            <div className="timeline">
              {timeline.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-degree">{item.degree}</div>
                  <div className="timeline-school">{item.school}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-title">{t('about.languages', lang)}</div>
            {languages.map((langItem, idx) => (
                <div key={langItem.key || idx} className="contact-item" style={{ marginTop: 6 }}>
                  <span>{langItem.flag}</span>
                  <span style={{ color: 'var(--cl-text-primary)', fontSize: 13 }}>
                    {langItem.key ? t(`about.${langItem.key}`, lang) : langItem.name}
                  </span>
                  {langItem.level && (
                    <span style={{ color: 'var(--cl-text-muted)', fontSize: 11, marginLeft: 4 }}>— {langItem.level}</span>
                  )}
                </div>
              ))}
          </div>

          <div className="panel">
            <div className="panel-title">{t('about.skills', lang)}</div>
            <div className="skills-wrap">
              {skills.map((skill) => (
                <span key={skill} className="skill-pill">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--cl-border)',
        textAlign: 'center', fontSize: 11, color: 'var(--cl-text-muted)', lineHeight: 1.8
      }}>
        Cabinet Laatig — plateforme conçue par et pour Mustapha Atiq, alliant intelligence artificielle
        et expertise humaine pour l'audit et la comptabilité marocains de nouvelle génération.
      </div>
    </div>
  );
}
