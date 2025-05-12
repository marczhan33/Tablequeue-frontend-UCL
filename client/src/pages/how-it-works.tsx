const HowItWorks = () => {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-heading mb-2">How TableQueue Works</h2>
        <p className="text-gray-600 max-w-3xl">Connecting restaurants and diners with real-time wait time information to improve the dining experience for everyone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <div>
          <h3 className="text-xl font-bold font-heading mb-6">For Restaurants</h3>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-semibold">1</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Register Your Restaurant</h4>
                <p className="text-gray-600">Create an account and add your restaurant's details including location, hours, and cuisine type.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-semibold">2</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Verify Your Location</h4>
                <p className="text-gray-600">We'll verify your restaurant's location to ensure accurate information for customers searching on Google Maps.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-semibold">3</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Update Wait Times</h4>
                <p className="text-gray-600">Easily update your current wait times with just a few clicks. Choose from preset options or enter custom wait times.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-semibold">4</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Attract More Customers</h4>
                <p className="text-gray-600">Customers can see your real-time availability directly in Google Maps, helping you fill empty tables and manage busy periods.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold font-heading mb-6">For Diners</h3>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">1</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Search for Restaurants</h4>
                <p className="text-gray-600">Find restaurants near you or in a specific location using our app or directly through Google Maps.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">2</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Check Wait Times</h4>
                <p className="text-gray-600">See real-time wait times for each restaurant before you leave home or while you're out and about.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">3</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Make Informed Decisions</h4>
                <p className="text-gray-600">Choose restaurants based on current wait times, helping you avoid long waits and find available tables quickly.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">4</div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Enjoy Your Meal</h4>
                <p className="text-gray-600">Arrive at the restaurant knowing exactly how long you'll need to wait for a table, making your dining experience more enjoyable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Example */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
        <h3 className="text-xl font-bold font-heading p-6 border-b">See TableQueue in Action</h3>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6">
            <h4 className="font-semibold text-lg mb-4">Google Maps Integration</h4>
            <img 
              src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Smartphone showing Google Maps" 
              className="rounded-lg shadow-sm mb-4 w-full" 
            />
            <p className="text-gray-600">When users search for restaurants on Google Maps, they'll see real-time wait times displayed directly on the map and in the restaurant listing.</p>
          </div>
          <div className="p-6 bg-gray-50">
            <h4 className="font-semibold text-lg mb-4">Restaurant Dashboard</h4>
            <img 
              src="https://images.unsplash.com/photo-1527239441953-caffd968d952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="People waiting in line at restaurant" 
              className="rounded-lg shadow-sm mb-4 w-full" 
            />
            <p className="text-gray-600">Restaurant owners can quickly update their wait times from our easy-to-use dashboard, ensuring customers always have the most current information.</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <h3 className="text-2xl font-bold font-heading mb-6">What Our Users Say</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold">Michael T.</h4>
              <p className="text-sm text-gray-500">Restaurant Owner</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <p className="text-gray-600">"TableQueue has helped us better manage customer expectations. We've seen fewer complaints about wait times and more satisfied customers since we started using it."</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold">Sarah L.</h4>
              <p className="text-sm text-gray-500">Foodie</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <p className="text-gray-600">"I love being able to check wait times before heading to a restaurant. It's saved me from so many long waits, especially on busy weekend nights!"</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold">David R.</h4>
              <p className="text-sm text-gray-500">Restaurant Manager</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex">
              {[1, 2, 3, 4].map((star) => (
                <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">"The Google Maps integration has been a game-changer for our business. We've seen an increase in customers during typically slower hours as they can see we have no wait time."</p>
        </div>
      </div>
    </>
  );
};

export default HowItWorks;
