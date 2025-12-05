// API Configuration
const API_BASE_URL = 'https://nexi.k.vu/Nexify-watch/v/api.php';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// State Management
const state = {
  currentPage: 'home',
  currentCategory: 'all',
  searchQuery: '',
  searchTimeout: null,
  data: {
    trending: [],
    popular: [],
    movies: [],
    tv: [],
    people: []
  }
};

// API Functions
async function fetchAPI(action, params = {}) {
  try {
    const queryParams = new URLSearchParams({
      action,
      ...params
    });
    
    const response = await fetch(`${API_BASE_URL}?${queryParams}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Fetch Error:', error);
    return null;
  }
}

function getImageUrl(path, size = 'w500') {
  if (!path) return 'https://via.placeholder.com/500x750/000000/666666?text=No+Image';
  return `${IMAGE_BASE_URL}${size}${path}`;
}

// Navigation
function navigate(page, category = 'all') {
  state.currentPage = page;
  state.currentCategory = category;
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
  
  // Close mobile menu
  document.getElementById('sidebar').classList.remove('active');
  
  render();
}

// Render Functions
async function render() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><i class="ri-loader-4-line"></i></div>';
  
  switch (state.currentPage) {
    case 'home':
      await renderHomePage();
      break;
    case 'trending':
      await renderTrendingPage();
      break;
    case 'popular':
      await renderPopularPage();
      break;
    case 'movies':
      await renderMoviesPage();
      break;
    case 'tv':
      await renderTVPage();
      break;
    case 'people':
      await renderPeoplePage();
      break;
    case 'details':
      await renderDetailsPage();
      break;
  }
}

async function renderHomePage() {
  await fetchTrending(state.currentCategory);
  const content = document.getElementById('content');
  
  const randomItem = state.data.trending[Math.floor(Math.random() * state.data.trending.length)];
  const mediaType = randomItem.media_type || 'movie';
  
  content.innerHTML = `
    <div class="hero-section">
      <div class="hero-background" style="background-image: url('${getImageUrl(randomItem.backdrop_path, 'original')}')"></div>
      <div class="hero-content">
        <img src="${getImageUrl(randomItem.poster_path)}" alt="${randomItem.title || randomItem.name}" class="hero-poster" />
        <div class="hero-info">
          <h1 class="hero-title">${randomItem.title || randomItem.name}</h1>
          <div class="hero-meta">
            <span class="hero-score">${Math.round(randomItem.vote_average * 10)}%</span>
            <span>${randomItem.release_date || randomItem.first_air_date || 'N/A'}</span>
            <span>${mediaType === 'movie' ? 'Movie' : 'TV Show'}</span>
          </div>
          ${randomItem.tagline ? `<p class="hero-tagline">"${randomItem.tagline}"</p>` : ''}
          <p class="hero-overview">${randomItem.overview || 'No overview available.'}</p>
          <div class="hero-buttons">
            <button class="btn btn-primary" onclick="openDetails('${mediaType}', ${randomItem.id})">
              <i class="ri-information-line"></i> More Info
            </button>
            <button class="btn btn-secondary" onclick="openTrailer('${mediaType}', ${randomItem.id})">
              <i class="ri-play-line"></i> Play Trailer
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Trending Now</h2>
        <div class="section-filter">
          <button class="filter-btn ${state.currentCategory === 'all' ? 'active' : ''}" onclick="filterTrending('all')">All</button>
          <button class="filter-btn ${state.currentCategory === 'movie' ? 'active' : ''}" onclick="filterTrending('movie')">Movies</button>
          <button class="filter-btn ${state.currentCategory === 'tv' ? 'active' : ''}" onclick="filterTrending('tv')">TV Shows</button>
        </div>
      </div>
      <div class="horizontal-scroll">
        ${state.data.trending.slice(0, 20).map(item => createHorizontalCard(item)).join('')}
      </div>
    </div>
  `;
}

async function renderTrendingPage() {
  await fetchTrending(state.currentCategory);
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Trending</h2>
        <div class="section-filter">
          <button class="filter-btn ${state.currentCategory === 'all' ? 'active' : ''}" onclick="filterTrending('all')">All</button>
          <button class="filter-btn ${state.currentCategory === 'movie' ? 'active' : ''}" onclick="filterTrending('movie')">Movies</button>
          <button class="filter-btn ${state.currentCategory === 'tv' ? 'active' : ''}" onclick="filterTrending('tv')">TV Shows</button>
        </div>
      </div>
      <div class="cards-grid">
        ${state.data.trending.map(item => createCard(item)).join('')}
      </div>
    </div>
  `;
}

async function renderPopularPage() {
  await fetchPopular(state.currentCategory);
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Popular</h2>
        <div class="section-filter">
          <button class="filter-btn ${state.currentCategory === 'movie' ? 'active' : ''}" onclick="filterPopular('movie')">Movies</button>
          <button class="filter-btn ${state.currentCategory === 'tv' ? 'active' : ''}" onclick="filterPopular('tv')">TV Shows</button>
        </div>
      </div>
      <div class="cards-grid">
        ${state.data.popular.map(item => createCard(item)).join('')}
      </div>
    </div>
  `;
}

async function renderMoviesPage() {
  await fetchMovies(state.currentCategory);
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Movies</h2>
        <div class="section-filter">
          <button class="filter-btn ${state.currentCategory === 'now_playing' ? 'active' : ''}" onclick="filterMovies('now_playing')">Now Playing</button>
          <button class="filter-btn ${state.currentCategory === 'popular' ? 'active' : ''}" onclick="filterMovies('popular')">Popular</button>
          <button class="filter-btn ${state.currentCategory === 'top_rated' ? 'active' : ''}" onclick="filterMovies('top_rated')">Top Rated</button>
          <button class="filter-btn ${state.currentCategory === 'upcoming' ? 'active' : ''}" onclick="filterMovies('upcoming')">Upcoming</button>
        </div>
      </div>
      <div class="cards-grid">
        ${state.data.movies.map(item => createCard(item, 'movie')).join('')}
      </div>
    </div>
  `;
}

async function renderTVPage() {
  await fetchTV(state.currentCategory);
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">TV Shows</h2>
        <div class="section-filter">
          <button class="filter-btn ${state.currentCategory === 'airing_today' ? 'active' : ''}" onclick="filterTV('airing_today')">Airing Today</button>
          <button class="filter-btn ${state.currentCategory === 'on_the_air' ? 'active' : ''}" onclick="filterTV('on_the_air')">On The Air</button>
          <button class="filter-btn ${state.currentCategory === 'popular' ? 'active' : ''}" onclick="filterTV('popular')">Popular</button>
          <button class="filter-btn ${state.currentCategory === 'top_rated' ? 'active' : ''}" onclick="filterTV('top_rated')">Top Rated</button>
        </div>
      </div>
      <div class="cards-grid">
        ${state.data.tv.map(item => createCard(item, 'tv')).join('')}
      </div>
    </div>
  `;
}

async function renderPeoplePage() {
  await fetchPeople();
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Popular People</h2>
      </div>
      <div class="cards-grid">
        ${state.data.people.map(person => createPersonCard(person)).join('')}
      </div>
    </div>
  `;
}

async function renderDetailsPage() {
  const content = document.getElementById('content');
  const { mediaType, id } = state.detailsData;
  
  const data = await fetchAPI('details', { id, type: mediaType });
  if (!data) return;
  
  const title = data.title || data.name;
  const posterUrl = getImageUrl(data.poster_path);
  const backdropUrl = getImageUrl(data.backdrop_path, 'original');
  const rating = Math.round(data.vote_average * 10);
  const releaseDate = data.release_date || data.first_air_date || 'N/A';
  const runtime = data.runtime || data.episode_run_time?.[0] || 'N/A';
  const genres = data.genres?.map(g => g.name).join(', ') || 'N/A';
  const overview = data.overview || 'No overview available.';
  
  content.innerHTML = `
    <div class="details-page">
      <div class="details-background" style="background-image: url('${backdropUrl}')"></div>
      <div class="details-container">
        <a href="#" onclick="navigate('${state.previousPage || 'home'}'); return false;" class="back-button">
          <i class="ri-arrow-left-line"></i>
          Back
        </a>
        <div class="details-hero">
          <img src="${posterUrl}" alt="${title}" class="details-poster" />
          <div class="details-info">
            <h1 class="details-title">${title}</h1>
            <div class="details-meta">
              <span><i class="ri-star-fill"></i> ${rating}%</span>
              <span><i class="ri-calendar-line"></i> ${releaseDate}</span>
              <span><i class="ri-time-line"></i> ${runtime} min</span>
            </div>
            <div class="details-meta">
              <span><i class="ri-movie-line"></i> ${genres}</span>
            </div>
            <p class="details-overview">${overview}</p>
            <div class="details-buttons">
              <button class="btn btn-primary" onclick="openTrailer('${mediaType}', ${data.id})">
                <i class="ri-play-fill"></i> Play Trailer
              </button>
              <button class="btn btn-primary" onclick="openPlayer('${mediaType}', ${data.id}, 1)">
                <i class="ri-play-circle-fill"></i> Play Link 1
              </button>
              <button class="btn btn-primary" onclick="openPlayer('${mediaType}', ${data.id}, 2)">
                <i class="ri-play-circle-fill"></i> Play Link 2
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Card Creation Functions
function createCard(item, mediaType = null) {
  const type = mediaType || item.media_type || 'movie';
  const title = item.title || item.name;
  const posterUrl = getImageUrl(item.poster_path);
  const rating = Math.round(item.vote_average * 10);
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  
  return `
    <div class="card" onclick="openDetails('${type}', ${item.id})">
      <img src="${posterUrl}" alt="${title}" class="card-poster" loading="lazy" />
      <div class="card-info">
        <h3 class="card-title">${title}</h3>
        <div class="card-meta">
          <span class="card-rating">
            <i class="ri-star-fill"></i> ${rating}%
          </span>
          <span>${year || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;
}

function createHorizontalCard(item) {
  const type = item.media_type || 'movie';
  const title = item.title || item.name;
  const backdropUrl = getImageUrl(item.backdrop_path, 'w780');
  const rating = Math.round(item.vote_average * 10);
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  
  return `
    <div class="horizontal-card" onclick="openDetails('${type}', ${item.id})">
      <img src="${backdropUrl}" alt="${title}" class="horizontal-card-poster" loading="lazy" />
      <div class="horizontal-card-info">
        <h3 class="horizontal-card-title">${title}</h3>
        <div class="horizontal-card-meta">
          <span><i class="ri-star-fill"></i> ${rating}%</span>
          <span>${year || 'N/A'}</span>
          <span>${type === 'movie' ? 'Movie' : 'TV'}</span>
        </div>
      </div>
    </div>
  `;
}

function createPersonCard(person) {
  const profileUrl = getImageUrl(person.profile_path);
  
  return `
    <div class="card">
      <img src="${profileUrl}" alt="${person.name}" class="card-poster" loading="lazy" />
      <div class="card-info">
        <h3 class="card-title">${person.name}</h3>
        <div class="card-meta">
          <span>${person.known_for_department || 'Actor'}</span>
        </div>
      </div>
    </div>
  `;
}

// Fetch Functions
async function fetchTrending(category = 'all') {
  const type = category === 'all' ? 'movie' : category;
  const data = await fetchAPI('trending', { type });
  state.data.trending = data?.results || [];
}

async function fetchPopular(category = 'movie') {
  const data = await fetchAPI('popular', { type: category });
  state.data.popular = data?.results || [];
}

async function fetchMovies(category = 'now_playing') {
  const data = await fetchAPI(category, { type: 'movie' });
  state.data.movies = data?.results || [];
}

async function fetchTV(category = 'airing_today') {
  const data = await fetchAPI(category, { type: 'tv' });
  state.data.tv = data?.results || [];
}

async function fetchPeople() {
  // People endpoint not available in PHP API, using popular movies instead
  const data = await fetchAPI('popular', { type: 'movie' });
  state.data.people = data?.results || [];
}

// Filter Functions
function filterTrending(category) {
  navigate('trending', category);
}

function filterPopular(category) {
  navigate('popular', category);
}

function filterMovies(category) {
  navigate('movies', category);
}

function filterTV(category) {
  navigate('tv', category);
}

// Details Function
function openDetails(mediaType, id) {
  state.previousPage = state.currentPage;
  state.currentPage = 'details';
  state.detailsData = { mediaType, id };
  render();
}

// Search Functions
async function handleSearch(query) {
  if (query.length < 2) {
    document.getElementById('searchResults').classList.remove('active');
    return;
  }
  
  const data = await fetchAPI('search', { query, type: 'movie' });
  const results = data?.results?.slice(0, 10) || [];
  
  const searchResults = document.getElementById('searchResults');
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No results found</div>';
  } else {
    searchResults.innerHTML = results.map(item => {
      const title = item.title || item.name;
      const posterUrl = getImageUrl(item.poster_path || item.profile_path, 'w200');
      const type = item.media_type;
      const year = (item.release_date || item.first_air_date || '').split('-')[0];
      
      return `
        <div class="search-result-item" onclick="openDetails('${type}', ${item.id}); document.getElementById('searchResults').classList.remove('active');">
          <img src="${posterUrl}" alt="${title}" class="search-result-img" />
          <div class="search-result-info">
            <h4>${title}</h4>
            <p>${type === 'movie' ? 'Movie' : type === 'tv' ? 'TV Show' : 'Person'} ${year ? `• ${year}` : ''}</p>
          </div>
        </div>
      `;
    }).join('');
  }
  
  searchResults.classList.add('active');
}

// Trailer Functions
async function openTrailer(type, id) {
  const data = await fetchAPI('videos', { id, type });
  const videos = data?.results || [];
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
  
  if (trailer) {
    const modal = document.getElementById('trailerModal');
    const container = document.getElementById('trailerContainer');
    
    container.innerHTML = `
      <div class="video-player">
        <iframe 
          src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" 
          allowfullscreen
          allow="autoplay; fullscreen"
        ></iframe>
      </div>
    `;
    
    modal.classList.add('active');
  } else {
    alert('No trailer available');
  }
}

function closeTrailer() {
  const modal = document.getElementById('trailerModal');
  const container = document.getElementById('trailerContainer');
  modal.classList.remove('active');
  container.innerHTML = '';
}

// Player Functions
function openPlayer(type, id, linkNumber) {
  const modal = document.getElementById('playerModal');
  const container = document.getElementById('playerContainer');
  
  let playerUrl = '';
  
  if (linkNumber === 1) {
    if (type === 'tv') {
      playerUrl = `https://vidsrc.cc/v2/embed/tv/${id}`;
    } else {
      playerUrl = `https://vidsrc.cc/v2/embed/movie/${id}`;
    }
  } else if (linkNumber === 2) {
    playerUrl = `https://embed.smashystream.com/playere.php?tmdb=${id}`;
  }
  
  container.innerHTML = `
    <div class="video-player">
      <iframe 
        src="${playerUrl}" 
        allowfullscreen
        allow="autoplay; fullscreen"
      ></iframe>
    </div>
  `;
  
  modal.classList.add('active');
}

function closePlayer() {
  const modal = document.getElementById('playerModal');
  const container = document.getElementById('playerContainer');
  modal.classList.remove('active');
  container.innerHTML = '';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      
      // Set default category based on page
      let category = 'all';
      if (page === 'popular') category = 'movie';
      if (page === 'movies') category = 'now_playing';
      if (page === 'tv') category = 'airing_today';
      
      navigate(page, category);
    });
  });
  
  // Mobile Menu
  document.getElementById('mobileMenuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
  
  // Search
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(() => {
      handleSearch(e.target.value);
    }, 300);
  });
  
  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      document.getElementById('searchResults').classList.remove('active');
    }
  });
  
  // Modal close on outside click
  document.getElementById('trailerModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeTrailer();
    }
  });
  
  document.getElementById('playerModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closePlayer();
    }
  });
  
  // Initial render
  render();
});
