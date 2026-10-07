import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRight, ArrowUpRight, Building2, CalendarDays, Check, CheckCheck, ChevronDown, Clock3, FileText, Heart, HelpCircle, Inbox, LayoutGrid, Leaf, MapPin, Plus, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import klarertLogo from '@/assets/klarert-logo.png';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categories, downloadReport, materials, type Material } from '@/lib/materials';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Klarert – B2B Ombruksregister Trøndelag' },
    { name: 'description', content: 'Finn og reserver ombrukbare byggematerialer i Trøndelag. Klareringsnivå, tilgjengelighet og klimabesparelser samlet på ett sted.' },
    { property: 'og:title', content: 'Klarert – Markedsplass for ombruk av byggematerialer' },
    { property: 'og:description', content: 'Ombrukbare materialer fra donorbygg i Trøndelag. En B2B-markedsplass for entreprenører, arkitekter og offentlige innkjøpere.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

type View = 'market' | 'survey' | 'reservations' | 'climate' | 'help';
type Reservation = { material: Material; quantity: string; project: string };
const navItems: { id: View; label: string; icon: typeof Search }[] = [
  { id: 'market', label: 'Markedsplass', icon: LayoutGrid },
  { id: 'survey', label: 'Ny kartlegging (§ 9-7)', icon: Plus },
  { id: 'reservations', label: 'Mine reservasjoner', icon: CalendarDays },
  { id: 'climate', label: 'Klimarapportering (CSRD)', icon: Leaf },
  { id: 'help', label: 'Hjelp / Regelverk', icon: HelpCircle },
];

function MaterialCard({ material: m, saved, reserved, onFavorite, onReserve }: { material: Material; saved: boolean; reserved: boolean; onFavorite: () => void; onReserve: () => void }) {
  return <article className="material-card">
    <div className="material-photo">
      <img src={m.image} alt={m.title + ' fra donorbygg'} width={512} height={512} loading={m.id <= 3 ? 'eager' : 'lazy'} />
      <Button variant="ghost" size="icon" className={'favorite' + (saved ? ' saved' : '')} onClick={onFavorite} aria-label={(saved ? 'Fjern favoritt: ' : 'Lagre favoritt: ') + m.title} aria-pressed={saved} title={saved ? 'Fjern fra favoritter' : 'Lagre som favoritt'}><Heart /></Button>
    </div>
    <div className="card-content">
      <div className={'badge clearance level-' + m.level}><ShieldCheck />Klarering: Nivå {m.level} ({m.level === 1 ? 'Deklarert' : m.level === 2 ? 'Verifisert' : 'Prøvet – SINTEF'})</div>
      <div className="badge availability"><Clock3 />Tilgjengelig: {m.dateLabel}</div>
      <h3>{m.title}</h3>
      <div className="specs"><strong>{m.quantity} {m.unit}</strong><span>|</span><span>Tilstand: {m.condition}</span></div>
      <div className="donor"><MapPin /><span>Donorbygg: {m.donor}, {m.city}</span></div>
      <div className="trust"><div>Selger: <span>{m.seller}</span></div><div>Ombruksrådgiver: <span>{m.advisor}</span></div></div>
      <div className="carbon"><Leaf />CO₂-besparelse: <strong>{m.co2} tonn</strong></div>
      <div className="price"><strong>{m.price.toLocaleString('nb-NO')} kr</strong><span>/ {m.unit}</span><small>Ekskl. mva</small></div>
      <Button className="reserve" onClick={onReserve} disabled={reserved}>{reserved ? <><Check />Reservert med opsjon</> : <>Reserver med opsjon<ArrowRight /></>}</Button>
      <Button variant="outline" className="report" onClick={() => void downloadReport(m)}><FileText />Se TEK17 § 9-7 rapport (PDF)</Button>
    </div>
  </article>;
}

function Index() {
  const [view, setView] = useState<View>('market');
  const [project, setProject] = useState('Nytt Formålsbygg');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle');
  const [levels, setLevels] = useState<number[]>([]);
  const [structure, setStructure] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [start, setStart] = useState('2027-01-01');
  const [end, setEnd] = useState('2027-12-31');
  const [sort, setSort] = useState('date');
  const [favorites, setFavorites] = useState([1, 3, 5]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [surveySaved, setSurveySaved] = useState(false);
  const [surveyName, setSurveyName] = useState('');
  const [surveyAddress, setSurveyAddress] = useState('');

  function resetFilters() { setQuery(''); setCategory('Alle'); setLevels([]); setStructure([]); setCities([]); setStart('2027-01-01'); setEnd('2027-12-31'); setOnlyFavorites(false); }
  function toggle<T,>(value: T, values: T[], setter: (values: T[]) => void) { setter(values.includes(value) ? values.filter(v => v !== value) : [...values, value]); }
  function reserve(m: Material) { setSelected(m); setQuantity(m.quantity.replace(/\s/g, '')); setConfirmed(false); }
  const filtered = useMemo(() => materials.filter(m => {
    const text = `${m.title} ${m.category} ${m.donor} ${m.city} ${m.seller}`.toLocaleLowerCase('nb');
    return text.includes(query.toLocaleLowerCase('nb').trim()) && (category === 'Alle' || m.category === category) && (!levels.length || levels.includes(m.level)) && (!cities.length || cities.includes(m.city)) && (!structure.length || structure.includes(m.structural ? 'Bærende' : 'Ikke-bærende')) && (!start || m.date >= start) && (!end || m.date <= end) && (!onlyFavorites || favorites.includes(m.id));
  }).sort((a,b) => sort === 'price' ? a.price-b.price : sort === 'co2' ? parseFloat(b.co2.replace(',','.'))-parseFloat(a.co2.replace(',','.')) : a.date.localeCompare(b.date)), [query, category, levels, cities, structure, start, end, onlyFavorites, favorites, sort]);
  const totalCO2 = reservations.reduce((sum,r) => sum + parseFloat(r.material.co2.replace(',','.')) * Number(r.quantity) / Number(r.material.quantity.replace(/\s/g,'')), 0);
  const activeFilters = query || category !== 'Alle' || levels.length || structure.length || cities.length || start !== '2027-01-01' || end !== '2027-12-31' || onlyFavorites;

  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand"><img className="brand-logo" src={klarertLogo} alt="Klarert" /><p className="brand-caption">Markedsplassen for brukte byggematerialer.</p></div>
        <div className="header-tools">
          <div className="project-control"><Building2 size={17} className="text-muted-foreground" /><div><small>Aktivt prosjekt</small><select value={project} onChange={e => setProject(e.target.value)} aria-label="Aktivt prosjekt"><option>Nytt Formålsbygg</option><option>Rehabilitering Lade</option><option>Stjørdal kulturhus</option></select></div></div>
          <Button variant="ghost" className="profile" onClick={() => setProfileOpen(true)} title="Vis brukerprofil"><span className="avatar">JH</span><span><strong>Veidekke AS</strong><small>J. Hansen</small></span><ChevronDown size={13} /></Button>
          <Button variant="ghost" size="icon" className="header-icon" onClick={() => { setOnlyFavorites(!onlyFavorites); setView('market'); }} title="Vis favoritter" aria-label={`Vis favoritter (${favorites.length})`} aria-pressed={onlyFavorites}><Heart /><span className="counter">{favorites.length}</span></Button>
          <Button variant="ghost" size="icon" onClick={() => setInboxOpen(true)} title="Innboks" aria-label="Åpne innboks"><Inbox /></Button>
        </div>
      </div>
      <nav className="navbar" aria-label="Hovedmeny">{navItems.map(item => <Button key={item.id} variant="ghost" className={'nav-item' + (view === item.id ? ' active' : '')} onClick={() => setView(item.id)} aria-current={view === item.id ? 'page' : undefined}><item.icon />{item.label}{item.id === 'reservations' && reservations.length > 0 && <span className="nav-count">{reservations.length}</span>}</Button>)}</nav>
    </header>
    <main className="page">
      {view === 'market' && <>
        <div className="page-heading"><div><h1>{onlyFavorites ? 'Mine favoritter' : 'Markedsplass'}</h1><p>Ingen varer selges før de er klarert.</p></div><div className="region-label"><span className="region-dot" />Ombruk i Trøndelag<MapPin size={14} /></div></div>
        <form className="searchbox" onSubmit={e => e.preventDefault()} role="search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Søk etter byggematerialer" placeholder="Søk på materialer, dimensjoner eller donorbygg (f.eks. fasadeplater, tegl, HEB 200)..." />{query && <Button size="icon" variant="ghost" onClick={() => setQuery('')} type="button" aria-label="Tøm søk"><X /></Button>}<Button type="submit" className="search-button">Søk materialer</Button></form>
        <div className="categories" aria-label="Materialkategorier">{categories.map(c => <Button variant="outline" key={c} className={'category' + (category === c ? ' active' : '')} onClick={() => setCategory(c)} aria-pressed={category === c}>{c === 'Alle' && <LayoutGrid size={13} />}{c}</Button>)}</div>
        <div className="market-layout">
          <aside className="filters" aria-label="Filtrer materialer">
            <div className="filter-title"><h2 className="flex items-center gap-2"><SlidersHorizontal size={14} />Filtrer partier</h2><Button className="reset" variant="ghost" onClick={resetFilters}>Nullstill</Button></div>
            <div className="filter-sections">
              <section className="filter-section"><h3>Klareringsnivå<HelpCircle size={12} className="text-muted-foreground" aria-label="Deklarert, verifisert eller prøvet" /></h3>{[1,2,3].map(n => <label className="filter-option" key={n}><input type="checkbox" checked={levels.includes(n)} onChange={() => toggle(n,levels,setLevels)} /><span>Nivå {n}: {n === 1 ? 'Deklarert' : n === 2 ? 'Verifisert' : 'Prøvet'}</span><small>{n === 1 ? '80 %' : n === 2 ? '15 %' : 'SINTEF'}</small></label>)}</section>
              <section className="filter-section"><h3>Framtidsvindu<CalendarDays size={12} className="text-muted-foreground" /></h3><p className="filter-hint">Når trenger du materialene?</p><input className="date-input" type="date" aria-label="Tilgjengelig fra" value={start} onChange={e => setStart(e.target.value)} /><div className="date-separator">til</div><input className="date-input" type="date" aria-label="Tilgjengelig til" value={end} min={start} onChange={e => setEnd(e.target.value)} /></section>
              <section className="filter-section"><h3>Bygningsdel<ChevronDown size={12} /></h3>{['Ikke-bærende','Bærende'].map(s => <label className="filter-option" key={s}><input type="checkbox" checked={structure.includes(s)} onChange={() => toggle(s,structure,setStructure)} />{s}</label>)}</section>
              <section className="filter-section"><h3>Geografi<MapPin size={12} /></h3>{['Trondheim','Stjørdal','Verdal'].map(c => <label className="filter-option" key={c}><input type="checkbox" checked={cities.includes(c)} onChange={() => toggle(c,cities,setCities)} />{c}</label>)}</section>
            </div>
            <div className="help-block"><ShieldCheck size={24} /><strong>Tryggere ombruk, sammen.</strong><div>Alle partier er kartlagt med et tydelig klareringsnivå.</div><a href="#klarering" onClick={e => { e.preventDefault(); setView('help'); }}>Om klareringsnivåene<ArrowUpRight size={12} /></a></div>
          </aside>
          <section aria-label="Materialpartier">
            <div className="results-header"><div><strong>Viser {filtered.length}</strong><span> av {activeFilters ? 6 : 34} partier</span></div><label className="sort-control"><ArrowDownUp size={12} /><span>Sorter etter:</span><select aria-label="Sorter materialer" value={sort} onChange={e => setSort(e.target.value)}><option value="date">Tilgjengelighetsdato (tidligst først)</option><option value="price">Pris (lavest først)</option><option value="co2">CO₂-besparelse (høyest først)</option></select></label></div>
            <div className="product-grid">{filtered.map(m => <MaterialCard key={m.id} material={m} saved={favorites.includes(m.id)} reserved={reservations.some(r => r.material.id === m.id)} onFavorite={() => toggle(m.id,favorites,setFavorites)} onReserve={() => reserve(m)} />)}{!filtered.length && <div className="empty-state"><Search size={28} /><h2>Ingen partier passer søket</h2><p>Prøv et annet materiale eller juster filtrene.</p><Button variant="outline" onClick={resetFilters}>Nullstill filtre</Button></div>}</div>
          </section>
        </div>
      </>}
      {view === 'reservations' && <section className="app-view"><h1 className="view-title">Mine reservasjoner</h1><p className="text-muted-foreground mb-6">Opsjoner knyttet til dine prosjekter.</p>{!reservations.length ? <div className="empty-state"><CalendarDays size={32} /><h2>Ingen reservasjoner ennå</h2><Button onClick={() => setView('market')}>Finn materialer<ArrowRight /></Button></div> : reservations.map(r => <div className="reservation-row" key={r.material.id}><img src={r.material.image} alt={r.material.title} width={90} height={70} /><div><h3>{r.material.title}</h3><p>{r.quantity} {r.material.unit} · {r.project} · Tilgjengelig {r.material.dateLabel}</p><span className="badge clearance"><CheckCheck />Opsjon registrert · Prototype</span></div><Button className="cancel" variant="outline" onClick={() => setReservations(reservations.filter(v => v.material.id !== r.material.id))}>Avbryt opsjon</Button></div>)}</section>}
      {view === 'survey' && <section className="app-view"><h1 className="view-title">Ny kartlegging (§ 9-7)</h1><p className="text-muted-foreground mb-8">Donorbygg og materialer for ombruk</p>{surveySaved ? <div className="success-message"><CheckCheck className="mb-2" /><strong>Kartlegging opprettet: {surveyName}</strong><div>{surveyAddress} · {project}</div><p>Eksempelutkastet er registrert for denne økten.</p><Button variant="outline" onClick={() => setSurveySaved(false)}>Ny kartlegging</Button></div> : <form onSubmit={e => { e.preventDefault(); setSurveySaved(true); }}><div className="form-grid"><label className="field">Navn på donorbygg<input required value={surveyName} onChange={e => setSurveyName(e.target.value)} placeholder="F.eks. Teknobyen bygg A" /></label><label className="field">Adresse<input required value={surveyAddress} onChange={e => setSurveyAddress(e.target.value)} placeholder="Gateadresse og sted" /></label><label className="field">Materialkategori<select>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label className="field">Forventet tilgjengelighet<input required type="date" defaultValue="2027-08-15" /></label><label className="field">Mengde<input required type="number" min="1" placeholder="1200" /></label><label className="field">Enhet<select><option>m²</option><option>stk</option><option>tonn</option><option>lm</option></select></label></div><p className="text-muted-foreground mt-6 text-xs">Prototypeutkast – ingen opplysninger sendes til selger eller rådgiver.</p><Button className="mt-6" type="submit"><Plus />Opprett kartlegging</Button></form>}</section>}
      {view === 'climate' && <section className="app-view"><h1 className="view-title">Klimarapportering (CSRD)</h1><p className="text-muted-foreground mb-8">Estimert ombrukseffekt fra dine opsjoner</p><div className="climate-metrics"><div>Estimert CO₂-besparelse<strong>{totalCO2.toLocaleString('nb-NO',{ maximumFractionDigits: 1 })} tonn</strong></div><div>Reserverte materialpartier<strong>{reservations.length}</strong></div><div>Prosjekter med opsjon<strong>{new Set(reservations.map(r => r.project)).size}</strong></div></div><p className="text-muted-foreground mt-6 text-xs">Eksempelberegning basert på reservert mengde. Ikke en verifisert CSRD-rapport.</p><Button className="mt-6" variant="outline" onClick={() => setView('reservations')}>Se reservasjoner<ArrowRight /></Button></section>}
      {view === 'help' && <section className="app-view"><h1 className="view-title">Hjelp / Regelverk</h1><p className="text-muted-foreground mb-6">Dokumentasjon og tryggere ombruk</p>{[
        ['Klareringsnivåene','Nivå 1: Deklarert av selger. Nivå 2: Verifisert av ombruksrådgiver. Nivå 3: Prøvet, for eksempel hos SINTEF. Nivåene er eksempler i denne prototypen og er ikke en garanti for et bestemt bruksområde.'],
        ['TEK17 § 9-7 – kartlegging for ombruk','Ombrukskartlegging identifiserer materialer som kan være egnet for ombruk. For det enkelte prosjektet må gjeldende regelverk og faktisk dokumentasjon kontrolleres. Rapportene i prototypen er tydelig merkede eksempler.'],
        ['Reservasjon med opsjon','En opsjon angir ønsket mengde og prosjekt. I denne prototypen lagres den bare i den aktive økten; ingen bestilling eller bindende avtale sendes.'],
        ['Klimabesparelser og CSRD','CO₂-tallene er illustrative estimater. Prosjektets klimaregnskap krever dokumenterte forutsetninger og en egnet metode. En opsjon er ikke det samme som gjennomført ombruk.'],
      ].map(([title,body],i) => <details className="help-detail" key={title} open={i === 0}><summary>{title}</summary><p>{body}</p></details>)}</section>}
      <footer className="footer-note"><span><ShieldCheck size={12} />Klarert – en ny standard for ombruk i Trøndelag</span><span>Desktop-prototype · Illustrative materialdata og bilder</span></footer>
    </main>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>{confirmed ? 'Opsjon registrert' : 'Reserver med opsjon'}</DialogTitle><DialogDescription>{confirmed ? 'Reservasjonen er knyttet til ditt aktive prosjekt.' : 'Velg mengde for prosjektet ditt. Pris er ekskl. mva.'}</DialogDescription></DialogHeader>{selected && <>{confirmed ? <><div className="success-message"><CheckCheck className="mb-2" /><strong>{selected.title}</strong><div>{quantity} {selected.unit} · {project}</div><div>Dette er en prototypeopsjon. Ingen avtale er sendt.</div></div><Button onClick={() => { setSelected(null); setView('reservations'); }}>Se mine reservasjoner<ArrowRight /></Button></> : <form onSubmit={e => { e.preventDefault(); setReservations([...reservations,{ material: selected, quantity, project }]); setConfirmed(true); }}><div className="modal-material"><img src={selected.image} alt={selected.title} width={100} height={80} /><div><h3>{selected.title}</h3><p>{selected.price.toLocaleString('nb-NO')} kr / {selected.unit} · {selected.dateLabel}</p></div></div><label className="field mb-4">Prosjekt<select value={project} onChange={e => setProject(e.target.value)}><option>Nytt Formålsbygg</option><option>Rehabilitering Lade</option><option>Stjørdal kulturhus</option></select></label><label className="field">Mengde ({selected.unit})<input type="number" required min="1" max={Number(selected.quantity.replace(/\s/g,''))} value={quantity} onChange={e => setQuantity(e.target.value)} /></label><div className="flex justify-between my-5 text-sm"><span>Estimert total ekskl. mva</span><strong>{(selected.price * Number(quantity)).toLocaleString('nb-NO')} kr</strong></div><p className="text-xs text-muted-foreground mb-5">Opsjonen gjelder kun i denne prototypeøkten. Selger mottar ingen bestilling.</p><Button className="w-full" type="submit">Bekreft opsjon<ArrowRight /></Button></form>}</>}</DialogContent></Dialog>
    <Dialog open={inboxOpen} onOpenChange={setInboxOpen}><DialogContent><DialogHeader><DialogTitle>Innboks</DialogTitle><DialogDescription>Meldinger knyttet til {project}</DialogDescription></DialogHeader><div className="inbox-message"><strong>Ingen nye meldinger</strong><p>Her samles dialogen med selgere og ombruksrådgivere når en opsjon er opprettet.</p></div><p className="text-xs text-muted-foreground">Prototype – ingen meldinger er sendt.</p></DialogContent></Dialog>
    <Dialog open={profileOpen} onOpenChange={setProfileOpen}><DialogContent><DialogHeader><DialogTitle>Brukerprofil</DialogTitle><DialogDescription>Eksempelprofil for Klarert-prototypen</DialogDescription></DialogHeader><div className="profile"><span className="avatar">JH</span><div><strong>J. Hansen</strong><small>Veidekke AS · Innkjøper</small></div></div><div className="field mt-4"><span>Aktivt prosjekt</span><strong>{project}</strong></div></DialogContent></Dialog>
  </>;
}
