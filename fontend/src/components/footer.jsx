function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} EventHub. Built by Rishi Pandey.</p>
        <p>React · Node · Express · MongoDB</p>
      </div>
    </footer>
  );
}

export default Footer;