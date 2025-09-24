
interface TestimonialCardProps {
  name: string;
  company: string;
  content: string;
  image?: string;
  rating?: number;
  source?: string;
}

const TestimonialCard = ({ name, company, content, image, rating = 5, source = "Google" }: TestimonialCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 mr-4">
          {image ? (
            <img src={image} alt={name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 bg-rgblue text-white rounded-full flex items-center justify-center font-semibold">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">{name}</h4>
          <p className="text-sm text-gray-600">{company}</p>
        </div>
      </div>
      
      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {source && <span className="text-xs text-gray-500 ml-2 self-center">via {source}</span>}
      </div>
      
      <p className="text-gray-700">{content}</p>
    </div>
  );
};

export default TestimonialCard;
