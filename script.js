document.addEventListener("DOMContentLoaded", function() {
    // 1. Add Tabs and Search Input into the DOM
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    
    // Create the Control Panel (Tabs & Search)
    const controlPanel = document.createElement('div');
    controlPanel.style.backgroundColor = '#1f2937';
    controlPanel.style.padding = '10px 20px';
    controlPanel.style.textAlign = 'center';
    controlPanel.style.position = 'sticky';
    controlPanel.style.top = '0';
    controlPanel.style.zIndex = '1001';
    controlPanel.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    controlPanel.innerHTML = `
        <button id="btn-artists" style="padding: 8px 16px; margin: 0 5px; cursor: pointer; font-weight: bold; background: #3b82f6; color: white; border: none; border-radius: 4px; transition: 0.2s;">Browse by Artist</button>
        <button id="btn-songs" style="padding: 8px 16px; margin: 0 5px; cursor: pointer; font-weight: normal; background: #e5e7eb; color: #333; border: none; border-radius: 4px; transition: 0.2s;">Browse by Song</button>
        <input type="text" id="search-input" placeholder="Search artists or songs (e.g., 'elvi')..." style="padding: 8px 12px; width: 100%; max-width: 350px; margin-left: 20px; border-radius: 4px; border: 1px solid #ccc; font-size: 15px;">
    `;
    
    // Insert after header, before nav menu
    header.parentNode.insertBefore(controlPanel, navMenu);
    navMenu.style.top = '50px'; // Adjust sticky top of A-Z menu so it sits under the search bar
    
    // 2. Extract Data & Create Song View
    const container = document.querySelector('.container');
    const artistSections = Array.from(document.querySelectorAll('.group-section'));
    
    // Create the container for the Song Tab
    const songContainer = document.createElement('div');
    songContainer.className = 'group-section';
    songContainer.id = 'song-view';
    songContainer.style.display = 'none';
    songContainer.innerHTML = '<h2 class="group-title">All Songs (A-Z)</h2><ul class="song-list" id="all-songs-ul"></ul>';
    
    const allSongsUl = songContainer.querySelector('#all-songs-ul');
    
    const songsData = [];
    // Read through the HTML to gather all songs
    document.querySelectorAll('.artist-songs-block').forEach(artistBlock => {
        let artistNameText = artistBlock.querySelector('.artist-name').textContent;
        // Remove the "↑ Top" text
        artistNameText = artistNameText.replace('↑ Top', '').trim();
        
        artistBlock.querySelectorAll('.song-item').forEach(songNode => {
            songsData.push({
                title: songNode.textContent.trim(),
                artist: artistNameText
            });
        });
    });
    
    // Sort Alphabetically by Song Title
    songsData.sort((a, b) => a.title.localeCompare(b.title));
    
    // Render the sorted songs using a DocumentFragment for performance
    const fragment = document.createDocumentFragment();
    const songNodesMap = []; // Array to map DOM elements to text for fast searching
    
    songsData.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `<strong>${song.title}</strong><br><small style="color:#6b7280;">${song.artist}</small>`;
        fragment.appendChild(li);
        
        songNodesMap.push({
            li: li,
            textStr: (song.title + " " + song.artist).toLowerCase()
        });
    });
    
    allSongsUl.appendChild(fragment);
    container.appendChild(songContainer);
    
    // 3. Tab Switching Logic
    const btnArtists = document.getElementById('btn-artists');
    const btnSongs = document.getElementById('btn-songs');
    let currentTab = 'artists'; 
    
    btnArtists.addEventListener('click', () => {
        currentTab = 'artists';
        btnArtists.style.background = '#3b82f6';
        btnArtists.style.color = 'white';
        btnArtists.style.fontWeight = 'bold';
        
        btnSongs.style.background = '#e5e7eb';
        btnSongs.style.color = '#333';
        btnSongs.style.fontWeight = 'normal';
        
        navMenu.style.display = 'block'; // Show A-Z
        songContainer.style.display = 'none';
        
        triggerSearch(); // Re-apply search filter
    });
    
    btnSongs.addEventListener('click', () => {
        currentTab = 'songs';
        btnSongs.style.background = '#3b82f6';
        btnSongs.style.color = 'white';
        btnSongs.style.fontWeight = 'bold';
        
        btnArtists.style.background = '#e5e7eb';
        btnArtists.style.color = '#333';
        btnArtists.style.fontWeight = 'normal';
        
        navMenu.style.display = 'none'; // Hide A-Z on song tab
        songContainer.style.display = 'block';
        
        triggerSearch(); // Re-apply search filter
    });
    
    // 4. Real-time Dynamic Search Logic
    const searchInput = document.getElementById('search-input');
    
    function triggerSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (currentTab === 'songs') {
            // Filter Song Tab
            songNodesMap.forEach(item => {
                if (item.textStr.includes(query)) {
                    item.li.style.display = '';
                } else {
                    item.li.style.display = 'none';
                }
            });
            artistSections.forEach(sec => sec.style.display = 'none'); // Keep artists hidden
            
        } else {
            // Filter Artist Tab
            songContainer.style.display = 'none'; // Keep songs hidden
            
            // If query is empty, reset the view
            if (!query) {
                artistSections.forEach(sec => {
                    sec.style.display = 'block';
                    const index = sec.querySelector('.artist-index');
                    if (index) index.style.display = 'flex';
                    
                    sec.querySelectorAll('.artist-songs-block').forEach(b => {
                        b.style.display = 'block';
                        b.querySelectorAll('.song-item').forEach(s => s.style.display = '');
                    });
                });
                return;
            }
            
            // If actively searching, hide the index links and filter content
            artistSections.forEach(sec => {
                const index = sec.querySelector('.artist-index');
                if (index) index.style.display = 'none';
                
                let sectionHasVisible = false;
                
                sec.querySelectorAll('.artist-songs-block').forEach(block => {
                    const artistName = block.querySelector('.artist-name').textContent.toLowerCase();
                    let blockHasVisible = false;
                    
                    if (artistName.includes(query)) {
                        // If the artist name matches, show all their songs
                        block.querySelectorAll('.song-item').forEach(s => s.style.display = '');
                        blockHasVisible = true;
                    } else {
                        // Otherwise, check if any individual song matches
                        block.querySelectorAll('.song-item').forEach(s => {
                            if (s.textContent.toLowerCase().includes(query)) {
                                s.style.display = '';
                                blockHasVisible = true;
                            } else {
                                s.style.display = 'none';
                            }
                        });
                    }
                    
                    block.style.display = blockHasVisible ? 'block' : 'none';
                    if (blockHasVisible) sectionHasVisible = true;
                });
                
                sec.style.display = sectionHasVisible ? 'block' : 'none';
            });
        }
    }
    
    // Add event listener with slight typing debounce for performance
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(triggerSearch, 150); 
    });
});
