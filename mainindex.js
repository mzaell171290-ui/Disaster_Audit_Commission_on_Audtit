var siteSearchIndex = [
    { type: "Report", title: "Assessment of Disaster Risk Reduction Management at the Local Level", tags: "drrm local government assessment", action: function(){ document.getElementById('modal-report1').showModal(); } },
    { type: "Report", title: "A Special Report on Typhoon Yolanda", tags: "typhoon yolanda haiyan special report", action: function(){ document.getElementById('modal-report2').showModal(); } },
    { type: "Report", title: "Citizen Participatory Audit", tags: "citizen participatory audit cpa category", action: function(){ document.getElementById('modal-report3').showModal(); } },
    { type: "Report", title: "Audit of Flood Control Infrastructure Projects", tags: "flood control infrastructure dpwh", action: function(){ document.getElementById('modal-report4').showModal(); } },
    { type: "Report", title: "Tracking Relief Goods Distribution", tags: "relief goods distribution warehouse tracking", action: function(){ document.getElementById('modal-report5').showModal(); } },
    { type: "Report", title: "Evaluation of Early Warning Systems", tags: "early warning sensors rain gauges sirens", action: function(){ document.getElementById('modal-report6').showModal(); } },

    { type: "Article", title: "Evolution of Disaster Laws in the Philippines", tags: "history executive order 335 quezon", action: function(){ openArticle('modal-article1'); } },
    { type: "Article", title: "Developing Governance Framework on DRRM", tags: "governance drrm conference coa 2013", action: function(){ openArticle('modal-article2'); } },
    { type: "Article", title: "Why do we need an Accounting Guide?", tags: "policy ra 10121 accounting guide", action: function(){ openArticle('modal-article3'); } },
    { type: "Article", title: "Field Perspectives on DRRM Governance", tags: "governance field auditors barangay", action: function(){ openArticle('modal-article4'); } },
    { type: "Article", title: "Auditing Emergency Procurement Rules", tags: "procurement emergency negotiated purchase", action: function(){ openArticle('modal-article5'); } },
    { type: "Article", title: "Tracing Donor Fund Reconciliation", tags: "finance donor fund reconciliation international aid", action: function(){ openArticle('modal-article6'); } },
    { type: "Article", title: "Inside the Citizen Participatory Audit", tags: "cpa citizen participatory audit volunteers", action: function(){ openArticle('modal-article7'); } },
    { type: "Article", title: "Lessons From Typhoon Yolanda Recovery", tags: "tacloban typhoon yolanda recovery resettlement", action: function(){ openArticle('modal-article8'); } },

    { type: "Gallery", title: "DRRM Seminar — Commissioner Mendoza @ GACPA Convention", tags: "drrm seminar mendoza gacpa gallery", action: function(){ document.getElementById('modal-library-gallery').showModal(); } },
    { type: "Gallery", title: "DSWD — Relief Operations for the victims of typhoon yolanda", tags: "dswd relief operations yolanda gallery", action: function(){ document.getElementById('modal-library-gallery').showModal(); } },
    { type: "Gallery", title: "COA/DRR — Briefing for COA Auditors of about DRR", tags: "coa drr briefing auditors gallery", action: function(){ document.getElementById('modal-library-gallery').showModal(); } }
  ];

  function runSiteSearch() {
    var input = document.getElementById('site-search-input');
    var resultsBox = document.getElementById('site-search-results');
    var query = (input.value || "").trim().toLowerCase();

    resultsBox.innerHTML = "";

    if (query.length === 0) {
      resultsBox.style.display = "none";
      return;
    }

    var matches = siteSearchIndex.filter(function (item) {
      var haystack = (item.title + " " + item.tags + " " + item.type).toLowerCase();
      return haystack.indexOf(query) !== -1;
    });

    var table = document.createElement("table");
    table.setAttribute("width", "100%");
    table.setAttribute("cellpadding", "8");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("border", "1");

    if (matches.length === 0) {
      var emptyRow = table.insertRow();
      var emptyCell = emptyRow.insertCell();
      emptyCell.innerHTML = "<font size='2' color='#777777'>No results found for \"" + query.replace(/</g, "&lt;") + "\".</font>";
    } else {
      matches.forEach(function (item, idx) {
        var row = table.insertRow();
        var cell = row.insertCell();
        cell.style.cursor = "pointer";
        cell.innerHTML =
          "<font color='#6B1E23' size='1'><b>" + item.type + "</b></font><br>" +
          "<font size='2' color='#333333'>" + item.title + "</font>";
        cell.onclick = (function (matchedItem) {
          return function () {
            document.getElementById('site-search-results').style.display = "none";
            document.getElementById('site-search-input').value = "";
            matchedItem.action();
          };
        })(item);
      });
    }

    resultsBox.appendChild(table);
    resultsBox.style.display = "block";
  }




  function openArticle(id) {
    var dlg = document.getElementById(id);
    if (!dlg) return;
    dlg.showModal();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        dlg.style.transform = 'translateX(0)';
      });
    });
  }

  function closeArticlePanel(id) {
    var dlg = document.getElementById(id);
    if (!dlg) return;
    dlg.style.transform = 'translateX(100%)';
    setTimeout(function () {
      dlg.close();
    }, 350);
  }


  document.addEventListener('DOMContentLoaded', function () {
    var panels = document.querySelectorAll('.article-panel');
    panels.forEach(function (dlg) {
      dlg.addEventListener('click', function (event) {
        if (event.target === dlg) {
          closeArticlePanel(dlg.id);
        }
      });
      dlg.addEventListener('close', function () {
        dlg.style.transform = 'translateX(100%)';
      });
    });
  });




  (function () {
    const select = document.getElementById('language-select');
    if (!select) return;

    const phrases = {
      "Reports ▼": "Mga Ulat ▼",
      "Gallery": "Galerya",
      "Articles": "Mga Artikulo",
      "Contacts": "Mga Kontak",
      "Home": "Bahay",
      "Contact Support": "Kontakin ang Suporta",
      "Get started": "Magsimula na",
      "REPUBLIC OF THE PHILIPPINES": "REPUBLIKA NG PILIPINAS",
      "Ensuring every single peso allocated for calamity response, mitigation, and national relief reaches its true intended purpose through rigorous, citizen-transparent tracking.": "Tinitiyak na ang bawat piso na inilaan para sa pagtugon sa sakuna, pag-iwas, at pambansang tulong ay nakararating sa tunay nitong layunin sa pamamagitan ng masusing pagsubaybay na malinaw sa mamamayan.",
      "Search tracking numbers, disaster allocations, or regional reports...": "Maghanap ng mga numero ng pagsubaybay, alokasyon sa sakuna, o mga ulat sa rehiyon...",
      "LIVE ALLOCATION MONITOR (SIMULATION)": "LIVE NA MONITOR NG ALOKASYON (SIMULASYON)",
      "Processed 4 mins ago": "Naiproseso 4 minuto ang nakalipas",
      "Processed 1 hour ago": "Naiproseso 1 oras ang nakalipas",
      "Processed 3 hours ago": "Naiproseso 3 oras ang nakalipas",
      "Response Teams Tracked": "Mga Pangkat ng Tugon na Na-track",
      "WELCOME TO DISASTER AUDIT": "MALIGAYANG PAGDATING SA DISASTER AUDIT",
      "The project is an attempt to improve accountability over disaster funds.": "Ang proyekto ay isang pagtatangka upang mapabuti ang pananagutan sa pondo ng sakuna.",
      "Read more →": "Magbasa pa →",
      "Close": "Isara",
      "Download Full Report": "I-download ang Buong Ulat",
      "MORE REPORTS": "HIGIT PANG MGA ULAT",
      "All available reports": "Lahat ng available na ulat",
      "Pick a report to open it:": "Pumili ulat para buksan ito:",
      "DOCUMENTATION LIBRARY": "AKLATAN NG DOKUMENTASYON",
      "Visual documentation of Commission on Audit's disaster response audits, field operations, and rehabilitation assessments — ensuring transparency and fiscal accountability where it matters most.": "Biswal na dokumentasyon ng mga pag-audit sa pagtugon sa sakuna ng Commission on Audit, mga operasyon sa field, at mga pagtatasa sa rehabilitasyon — na tinitiyak ang transparency at pananagutan sa pananalapi kung saan ito pinakamahalaga.",
      "ALL": "LAHAT",
      "View More..": "Tingnan pa..",
      "Full Photo Gallery": "Buong Koleksyon ng Larawan",
      "Commission on Audit": "Komisyon sa Pag-audit",
      "Product": "Produkto",
      "Resources": "Mga Mapagkukunan",
      "Community": "Komunidad",
      "Company": "Kumpanya",
      "Support": "Suporta",
      "Features": "Mga Tampok",
      "Pricing": "Presyo",
      "Blog": "Blog",
      "User guides": "Mga gabay ng user",
      "Webinars": "Mga webinar",
      "Developers": "Mga developer",
      "Users": "Mga user",
      "About": "Tungkol sa",
      "Join us": "Sumali sa amin",
      "Help center": "Sentro ng tulong",
      "Chat support": "Suporta sa chat",
      "Privacy": "Pribasiya",
      "Terms": "Mga Tuntunin",
      "Quezon City": "Lungsod ng Quezon"
    };

    const textNodes = [];
    const originalTexts = new Map();

    function collectTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim()) {
        textNodes.push(node);
        originalTexts.set(node, node.nodeValue);
      } else {
        for (let child = node.firstChild; child; child = child.nextSibling) {
          collectTextNodes(child);
        }
      }
    }

    collectTextNodes(document.body);

    function applyTranslation(language) {
      textNodes.forEach(function (node) {
        const original = originalTexts.get(node) || node.nodeValue;
        if (language === 'Filipino') {
          let translated = original;
          Object.keys(phrases).forEach(function (key) {
            translated = translated.split(key).join(phrases[key]);
          });
          node.nodeValue = translated;
        } else {
          node.nodeValue = original;
        }
      });
    }

    select.addEventListener('change', function () {
      applyTranslation(this.value);
    });
  })();


  // VIDEO CAROUSEL (map section) video carousel but in js form
  var videoCarouselVideos = [
    { src: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\Sources\\Intro.mp4", poster: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\EQs_1900-2013_worldseis.png" },
    { src: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\Sources\\Relief operation.mp4", poster: "" },
    { src: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\Sources\\Video3.mp4", poster: "" },
    { src: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\Sources\\Video4.mp4", poster: "" },
    { src: "C:\\Users\\Vonn\\Downloads\\Disaster Audit\\Sources\\Video5.mp4", poster: "" }
  ];

  var videoCarouselIndex = 0;

  function videoCarouselRender() {
    var video = document.getElementById('video-carousel-player');
    var source = document.getElementById('video-carousel-source');
    var dotsEl = document.getElementById('video-carousel-dots');
    if (!video || !source) return;

    var current = videoCarouselVideos[videoCarouselIndex];
    source.src = current.src;

    if (current.poster) {
      video.setAttribute('poster', current.poster);
    } else {
      video.removeAttribute('poster');
    }

    video.load();
    video.pause();

    if (dotsEl) {
      var dotsHtml = "";
      for (var i = 0; i < videoCarouselVideos.length; i++) {
        dotsHtml += (i === videoCarouselIndex ? "&#9679; " : "&#9675; ");
      }
      dotsEl.innerHTML = dotsHtml.trim();
    }
  }

  function videoCarouselNext() {
    videoCarouselIndex = (videoCarouselIndex + 1) % videoCarouselVideos.length;
    videoCarouselRender();
  }

  function videoCarouselPrev() {
    videoCarouselIndex = (videoCarouselIndex - 1 + videoCarouselVideos.length) % videoCarouselVideos.length;
    videoCarouselRender();
  }



document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('reports-toggle');
  var dropdown = document.getElementById('reports-dropdown');
  if (!toggle || !dropdown) return;


  toggle.addEventListener('click', function (event) {
    event.stopPropagation();
    dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
  });


  var items = dropdown.querySelectorAll('.reports-dropdown-item');
  items.forEach(function (item) {
    item.addEventListener('click', function () {
      dropdown.style.display = 'none';
      var modal = document.getElementById(this.getAttribute('data-modal'));
      if (modal) modal.showModal();
    });
  });


  document.addEventListener('click', function (event) {
    if (dropdown.style.display !== 'block') return;
    var clickedInsideMenu = dropdown.contains(event.target);
    var clickedToggle = toggle.contains(event.target);
    if (!clickedInsideMenu && !clickedToggle) {
      dropdown.style.display = 'none';
    }
  });
});

(function () {
  var lightbox = document.createElement('dialog');
  lightbox.id = 'image-lightbox';
  lightbox.style.cssText =
    'padding:0;border:none;margin:0;width:100%;height:100%;max-width:100vw;max-height:100vh;' +
    'background:rgba(0,0,0,0.94);';

  lightbox.innerHTML =
    '<a href="javascript:void(0)" id="lightbox-close" ' +
    'style="position:absolute;top:20px;right:30px;color:#ffffff;font-size:28px;font-weight:bold;' +
    'text-decoration:none;z-index:2;">&#10005;</a>' +

    '<a href="javascript:void(0)" id="lightbox-prev" ' +
    'style="position:absolute;top:50%;left:20px;transform:translateY(-50%);color:#ffffff;' +
    'font-size:40px;text-decoration:none;z-index:2;">&#8592;</a>' +

    '<a href="javascript:void(0)" id="lightbox-next" ' +
    'style="position:absolute;top:50%;right:20px;transform:translateY(-50%);color:#ffffff;' +
    'font-size:40px;text-decoration:none;z-index:2;">&#8594;</a>' +

    '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;box-sizing:border-box;padding:60px;">' +
    '<img id="lightbox-img" src="" style="max-width:100%;max-height:100%;box-shadow:0 6px 24px rgba(0,0,0,0.6);">' +
    '</div>' +

    '<div id="lightbox-caption" style="position:absolute;bottom:20px;left:0;width:100%;text-align:center;' +
    'color:#f0e9e6;font-size:14px;"></div>';

  document.body.appendChild(lightbox);

  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var currentGalleryImages = [];
  var currentIndex = 0;

  function showImageAt(index) {
    if (!currentGalleryImages.length) return;
    currentIndex = (index + currentGalleryImages.length) % currentGalleryImages.length;
    var img = currentGalleryImages[currentIndex];
    lightboxImg.src = img.getAttribute('src');
    lightboxCaption.textContent = img.getAttribute('alt') || '';
  }

  function openLightbox(clickedImg, imgGroup) {
    currentGalleryImages = imgGroup;
    currentIndex = imgGroup.indexOf(clickedImg);
    showImageAt(currentIndex);
    lightbox.showModal();
  }

  function closeLightbox() {
    lightbox.close();
  }

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', function () { showImageAt(currentIndex - 1); });
  document.getElementById('lightbox-next').addEventListener('click', function () { showImageAt(currentIndex + 1); });

  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.open) return;
    if (event.key === 'ArrowLeft') showImageAt(currentIndex - 1);
    if (event.key === 'ArrowRight') showImageAt(currentIndex + 1);
  });

  function attachLightboxToContainer(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var imgs = Array.prototype.slice.call(container.querySelectorAll('img'));
    imgs.forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function (event) {
        event.stopPropagation();
        openLightbox(img, imgs);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    attachLightboxToContainer('#modal-library-gallery');
    attachLightboxToContainer('#modal-articles-gallery');
  });
})();