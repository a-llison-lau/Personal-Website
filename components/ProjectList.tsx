import ProjectItem from "./ProjectItem";
import data from "./data/projects.json";

const ProjectList = (): JSX.Element => {
  return (
    <section className="grid" id="publications">
      <h1 className="text-2xl font-bold mt-12 mb-4">Projects</h1>
      <div>
        {data.map((project, index) => (
          <ProjectItem project={project} index={index} />
        ))}
      </div>
    </section>
  );
};

export default ProjectList;
