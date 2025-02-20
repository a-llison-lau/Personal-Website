import React from "react";
import { Github } from "lucide-react";

interface ProjectProps {
  project: {
    title: string;
    description: string;
    img: string;
    date: string;
    tags: string[];
    github: string;
    "project link": string;
  };
  index: number;
}

const ProjectItem = ({ project, index }: ProjectProps): JSX.Element => {
  return (
    <div className="mb-8 w-full">
      <div 
        onClick={() => window.open(project["project link"], "_blank")}
        className="cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl shadow-lg flex flex-col h-full"
      >
        <div className="relative h-48">
          <img
            className="rounded-t-lg w-full h-full object-cover"
            src={project.img}
            alt=""
          />
        </div>
        <div className="flex-1 bg-gray-50 p-6 rounded-b-lg">
          <div className="flex justify-between items-start">
            <h2 className="text-base font-bold text-gray-900">
              {project.title}
            </h2>
            <span className="text-gray-500 text-xs">{project.date}</span>
          </div>
          <p className="text-gray-600 mt-3 mb-4 text-sm line-clamp-3">
            {project.description}
          </p>
          <div className="mt-auto">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-gray-600">Tags:</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mr-2">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs hover:bg-gray-300 transition-colors"
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
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectItem;