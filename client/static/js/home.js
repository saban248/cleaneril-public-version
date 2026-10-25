const logo = document.getElementById("logo");
const heroHeight = document.querySelector(".head-home").offsetHeight;

window.addEventListener("scroll", () => {
    let sc = window.scrollY;
    
    // scale from 1 → min 0.6
    let scale = 1 - (sc / (heroHeight * 1.5));

    if (scale < 0.6) scale = 0.6; // minimum size

    logo.style.transform = `scale(${scale})`;
});



function openWhatsApp(full_link){
    if (!location.host.includes("127.0.0.1")){
        gtag('event', 'whatsapp_link', {
            link: full_link,
            page_location: window.location.href
        });
    }
    open(full_link, "_blank")
    
}

function phoneCall(number){
    if (!location.host.includes("127.0.0.1")){
        gtag('event', 'phone_call', {
            phone_number: number,
            page_location: window.location.href
        });
    }
    location.href = 'tel:'+number
}

function openSocielMedia(social){
    switch (social){
        case SocialMedia.GOOGLE:
            link = 'https://share.google/8fkNArknlSb1hgq4c'
            break;
        case SocialMedia.TIKTOK:
            link = 'https://www.tiktok.com/@cleaneril'
            break;
        case SocialMedia.FACEBOOK:
            link = 'https://www.facebook.com/p/%D7%94%D7%91%D7%A8%D7%A7%D7%94-%D7%91%D7%93%D7%A7%D7%94-%D7%A0%D7%99%D7%A7%D7%95%D7%99-%D7%A8%D7%99%D7%A4%D7%95%D7%93%D7%99%D7%9D-61559552106769/?wtsid=rdr_0qRVWX5f3Fn4Tomu1'
            break;
            case SocialMedia.INSTEGRAM:
            link = 'https://www.instagram.com/cleaneril/'
        default:
            break;
    }

    open(link, "_blank")
    
}


const cards = document.querySelectorAll('.recommend');
const nextBtn = document.querySelector('.fa-circle-arrow-left');   // LEFT = NEXT
const prevBtn = document.querySelector('.fa-circle-arrow-right'); // RIGHT = PREV

let index = 0; // Start from the rightmost card (index 0)

function updateSlider() {
    cards.forEach(c => {
        c.classList.remove('current', 'next', 'previous', 'r-front');
        c.style.display = "none";
    });

    const total = cards.length;

    let current = index;
    let next = (index + 1) % total;
    let prev = (index - 1 + total) % total;

    cards[current].classList.add('current', 'r-front');
    cards[current].style.display = "block";

    cards[next].classList.add('next');
    cards[next].style.display = "block";

    cards[prev].classList.add('previous');
    cards[prev].style.display = "block";
}

nextBtn.addEventListener('click', () => {
    index = (index + 1) % cards.length; // move leftwards
    updateSlider();
});

prevBtn.addEventListener('click', () => {
    index = (index - 1 + cards.length) % cards.length; // move rightwards
    updateSlider();
});

updateSlider();

// --- Pin welcome to top when reaching the aboutus/works section ---
(function(){
    const welcome = document.querySelector('.body-home > .welcome');
    const about = document.querySelector('.aboutus.works') || document.getElementById('recommends');
    if (!welcome || !about) return;

    let pinned = false;

    const head = document.querySelector('.head-home');

})();
