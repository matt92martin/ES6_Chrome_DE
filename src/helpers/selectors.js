export const qsa = (query) => {
    return document.querySelectorAll(query);
};
export const qs = (query) => {
    return document.querySelector(query);
};

export const gid = (id) => {
    return document.getElementById(id);
};

export const getClosest = ( elem, selector ) => {
    for ( ; elem && elem !== document; elem = elem.parentNode ) {
        if ( elem.matches( selector ) ) return elem;
    }
    return null;
};

export const getPrev = ( tag, cls ) => {
    let prev = tag.previousElementSibling;
    while ( prev && !prev.classList.contains( cls ) ) {
        prev = prev.previousElementSibling
    }
    return prev
};
