const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=80`;

export const PHOTOS = {
  signup: unsplash("1618424668469-130e5ecac826"),
  signin: unsplash("1571205164949-a09a668e94b6"),
  reset: unsplash("1587121748119-ffb5090f9d82"),
};