import React from 'react';
import { Github } from 'lucide-react';

interface ProjectProps {
  project: {
    title: string;
    description: string;
    img: string;
    date: string;
    tags: string[];
    github: string;
    'project link': string;
  };
  index: number;
}

const ProjectItem = ({ project, index }: ProjectProps): JSX.Element => {
  return (
    <div className="mb-8 mx-auto lg:w-11/12">
      <a 
        href={project['project link']} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block cursor-pointer"
      >
        <div className="transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl shadow-lg lg:flex lg:flex-row lg:h-auto">
          <div className="lg:w-6/12 relative">
            <img
              className="rounded-tr-lg rounded-tl-lg w-full h-full object-cover lg:rounded-bl-lg lg:rounded-tr-none"
              src={project.img}
              alt=""
            />
          </div>
          <div className="w-full bg-gray-50 p-8 rounded-bl-lg rounded-br-lg lg:rounded-bl-none lg:rounded-tr-lg">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold text-gray-900">{project.title}</h2>
              <span className="text-gray-500 text-xs">{project.date}</span>
            </div>
            <p className="text-gray-600 mt-4 mb-6 text-sm">{project.description}</p>
            <div className="mt-auto">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-gray-600">Tags:</div>
                  <div className="flex flex-wrap gap-2 mt-2 mr-2">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm hover:bg-gray-300 transition-colors overflow-x-auto"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default ProjectItem;