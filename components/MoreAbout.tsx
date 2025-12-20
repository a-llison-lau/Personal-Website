const MoreAbout = (): JSX.Element => {
  return (
    <section className="grid mt-8" id="moreabout">
      <div className="text-base">
        I am an explorer at heart, driven by a curiosity to understand the
        world. <a href="#work" className="underline hover:text-gray-600 dark:hover:text-gray-300">My previous work</a> spans diverse
        domains, including causal effect estimation and security in LLMs,
        computational sensing, medical computer graphics, and interdisciplinary
        science and instrumentation. In my free time, I like to enjoy the outdoors and learn something new!
      </div>
    </section>
  );
};

export default MoreAbout;
