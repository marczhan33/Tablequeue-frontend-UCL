const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="text-primary text-3xl mr-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 002 2v1a1 1 0 102 0v-1a2 2 0 002-2v-1a2 2 0 00-2-2V6zm6 0a1 1 0 10-2 0v1a2 2 0 00-2 2v1a2 2 0 002 2v1a1 1 0 102 0v-1a2 2 0 002-2v-1a2 2 0 00-2-2V6z" 
                  clipRule="evenodd" 
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold tracking-tight font-heading text-dark">TableQueue</h1>
          </div>
          <div>
            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-medium shadow-sm">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
