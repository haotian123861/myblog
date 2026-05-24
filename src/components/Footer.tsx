export default function Footer() {
  return (
    <div className="footer-box box-shadow-wrapper">
      <footer className="footer">
        <div className="copyright">
          Powered by <a href="https://react.dev" target="_blank">React</a> | &copy; {new Date().getFullYear()} Calm Halo T
        </div>
        <div className="poweredby">
          在学习中成长，在分享中收获
        </div>
      </footer>
    </div>
  );
}
