import { useEffect, useState } from 'react'
import { ArrowUpRight, Bookmark, ChevronRight, Film, Search, Sparkles, Star, Tv, UserRound, X } from 'lucide-react'
import localSeries from './api/my_series.json'
import './App.css'

const tabs = ['Discover', 'K-Dramas', 'Trending']
const kDramaIds = new Set(['lovely-runner', 'business-proposal', 'Queen-of-tears', 'my-demon', 'goblin', 'crash-landing-on-you', 'Vincenzo', 'all-of-us-are-dead'])
const trendingOrder = ['Queen-of-tears', 'lovely-runner', 'my-demon', 'Vincenzo', 'crash-landing-on-you', 'goblin', 'business-proposal', 'all-of-us-are-dead', 'arafta']

function posterUrl(item) {
  if (item.image?.original || item.image?.medium) return item.image.original || item.image.medium
  if (item.img_url?.startsWith('../../images/')) return `/images/${item.img_url.split('/').pop()}`
  return item.img_url ? `/${item.img_url}` : '/Arafta.jpg'
}

function localToShow(item) {
  return {
    id: item.id,
    name: item.name,
    image: { original: posterUrl(item) },
    rating: { average: Number(item.rating) },
    summary: item.description,
    genres: item.genre,
    url: item.watch_url,
    network: { name: item.watch_url?.includes('netflix') ? 'Netflix' : 'Watch provider' },
    local: true,
    isKDrama: kDramaIds.has(item.id),
    trendingRank: trendingOrder.indexOf(item.id),
  }
}

const initialSeries = localSeries.map(localToShow)

function App() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Discover')
  const [results, setResults] = useState(initialSeries)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [savedIds, setSavedIds] = useState([])
  const [visibleCount, setVisibleCount] = useState(9)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const trimmedQuery = query.trim()
        let nextResults
        if (trimmedQuery) {
          const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
          if (!response.ok) throw new Error('Search unavailable')
          const data = await response.json()
          nextResults = data.map(({ show }) => show)
        } else if (activeTab === 'K-Dramas') {
          const responses = await Promise.all(['korean drama', 'k-drama'].map((term) => fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`, { signal: controller.signal })))
          const data = await Promise.all(responses.map((response) => response.json()))
          const uniqueShows = new Map([
            ...initialSeries.filter((movie) => movie.isKDrama).map((movie) => [movie.id, movie]),
            ...data.flat().map(({ show }) => [show.id, show]),
          ])
          nextResults = [...uniqueShows.values()]
        } else {
          const page = activeTab === 'Trending' ? 1 : 0
          const response = await fetch(`https://api.tvmaze.com/shows?page=${page}`, { signal: controller.signal })
          if (!response.ok) throw new Error('Catalog unavailable')
          nextResults = await response.json()
          if (activeTab === 'Trending') nextResults.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
        }
        setResults(nextResults)
        setVisibleCount(9)
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          setResults(activeTab === 'K-Dramas' ? initialSeries.filter((movie) => movie.isKDrama) : activeTab === 'Trending' ? [...initialSeries].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)) : initialSeries)
          setError('Live catalog is unavailable. Showing Cinewave picks instead.')
        }
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, activeTab])

  const visibleResults = results
  const displayedResults = visibleResults.slice(0, visibleCount)
  const savedMovies = initialSeries.filter((movie) => savedIds.includes(movie.id))

  function toggleSaved(id) {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id])
  }

  function selectTab(tab) {
    setActiveTab(tab)
    setVisibleCount(9)
    document.querySelector('.catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="Cinewave home"><span className="brand-mark"><Film size={17} /></span>cinewave</a>
        <div className="nav-links">
          {tabs.map((tab) => <button className={activeTab === tab ? 'nav-link active' : 'nav-link'} key={tab} onClick={() => selectTab(tab)}>{tab}</button>)}
        </div>
        <button className="profile-button" aria-label="Open profile" onClick={() => setProfileOpen(true)}><UserRound size={18} /><span>My profile</span><span className="saved-count">{savedIds.length}</span></button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> Your next favorite story</p>
          <button className="hero-title" onClick={() => document.querySelector('.catalogue')?.scrollIntoView({ behavior: 'smooth' })}><h1>Find something<br /><em>worth watching.</em></h1></button>
          <p className="hero-text">Search across a world of movies and series. Curated picks, honest ratings, and the right place to press play.</p>
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.querySelector('.catalogue')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <Search size={21} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a title, genre, or mood..." aria-label="Search movies and series" />
            {query && <button type="button" className="clear-button" onClick={() => setQuery('')} aria-label="Clear search"><X size={17} /></button>}
            <button className="search-submit" type="submit">Search</button>
          </form>
          <p className="search-note"><Tv size={14} /> Live results powered by TVmaze</p>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-poster poster-one" /><div className="hero-poster poster-two" /><div className="hero-poster poster-three" /></div>
      </section>

      <section className="catalogue">
        <div className="section-heading"><div><p className="eyebrow">{query ? 'Search results' : activeTab}</p><button className="section-title" onClick={() => setActiveTab(activeTab === 'Discover' ? 'Trending' : 'Discover')}><h2>{query ? `Titles matching “${query}”` : activeTab === 'K-Dramas' ? 'K-drama stories for you' : activeTab === 'Trending' ? 'What everyone is watching' : 'Made for your watchlist'}</h2></button></div><button className="result-count" onClick={() => setVisibleCount((current) => current >= visibleResults.length ? 9 : current + 9)} disabled={loading || visibleResults.length <= 9}>{loading ? 'Searching...' : `${visibleResults.length} titles`} <ChevronRight size={16} /></button></div>
        {error && <p className="error-message">{error}</p>}
        {!loading && !visibleResults.length && <div className="empty-state"><Search size={24} /><h3>No titles found</h3><p>Try a different search, like “drama” or “comedy”.</p></div>}
        <div className="movie-grid">{displayedResults.map((movie) => <article className="movie-card" key={movie.id}>
          <div className="poster-wrap"><img src={posterUrl(movie)} alt={`${movie.name} poster`} /><span className="score"><Star size={12} fill="currentColor" /> {movie.rating?.average ? movie.rating.average.toFixed(1) : '—'}</span></div>
          <div className="movie-info"><div className="movie-title-row"><h3>{movie.name}</h3><button className={savedIds.includes(movie.id) ? 'save-button saved' : 'save-button'} onClick={() => toggleSaved(movie.id)} aria-label={savedIds.includes(movie.id) ? `Remove ${movie.name} from saved titles` : `Save ${movie.name}`}><Bookmark size={15} fill={savedIds.includes(movie.id) ? 'currentColor' : 'none'} /></button><span>{movie.premiered?.slice(0, 4) || ''}</span></div><p className="genres">{movie.genres?.slice(0, 2).join(' / ') || 'Series'}</p><p className="summary">{movie.summary?.replace(/<[^>]+>/g, '') || 'A story waiting to be discovered.'}</p><a className="watch-link" href={movie.url || `https://www.google.com/search?q=where+to+watch+${encodeURIComponent(movie.name)}`} target="_blank" rel="noreferrer">Where to watch <ArrowUpRight size={15} /></a></div>
        </article>)}</div>
      </section>
      <footer><span className="brand-mark"><Film size={14} /></span> cinewave <span>Discover stories. Watch responsibly.</span></footer>
      {profileOpen && <div className="drawer-backdrop" onClick={() => setProfileOpen(false)}><aside className="profile-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><p className="eyebrow">Your cinewave</p><h2>My profile</h2></div><button className="drawer-close" onClick={() => setProfileOpen(false)} aria-label="Close profile"><X size={19} /></button></div><div className="profile-avatar"><UserRound size={28} /></div><h3>Megha</h3><p className="profile-copy">Keep your favorite stories close and build a watchlist for later.</p><div className="saved-heading"><strong>Saved titles</strong><span>{savedMovies.length}</span></div>{savedMovies.length ? <div className="saved-list">{savedMovies.map((movie) => <button className="saved-item" key={movie.id} onClick={() => { setQuery(movie.name); setProfileOpen(false) }}><img src={posterUrl(movie)} alt="" /><span>{movie.name}</span><ChevronRight size={15} /></button>)}</div> : <div className="saved-empty"><Bookmark size={19} /><p>Your watchlist is empty.</p><button onClick={() => setProfileOpen(false)}>Browse titles</button></div>}</aside></div>}
    </main>
  )
}

export default App
