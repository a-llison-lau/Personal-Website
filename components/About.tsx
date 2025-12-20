import Image from "next/image";
import ExtLink from "./ExtLink";
import ProfileImage from "./ProfileImage";
import SupportingBox from "./SupportingBox";
import personalInfo from "./data/personalInfo.json";

const About = (): JSX.Element => {
  return (
    <section className="grid gap-12" id="about">
      <div className="flex justify-between">
        <div className="mr-8 hidden md:flex flex-col items-center justify-center">
          <div className="flex justify-center w-full">
            <ProfileImage />
          </div>
          <div className="mt-8 flex justify-center w-full">
            <SupportingBox />
          </div>
        </div>
        <div className="flex flex-col max-w-xl w-full justify-evenly">
          <h1 className="text-4xl font-bold pb-10 md:pb-0">
            {personalInfo.name}
          </h1>
          <h3 className="text-xl font-bold md:pb-0">Grüezi 👋 !</h3>
          <p>
            I am a Master's student in computer science at{" "}
            <ExtLink href="https://inf.ethz.ch/">ETH Zurich</ExtLink>, where I
            aspire to work on research problems in rendering or physics-based animations. I am currently also a research engineer at <ExtLink href="https://www.vocadian.ai">Vocadian</ExtLink>. I did my undergraduate studies
            in physics and computer science at the{" "}
            <ExtLink href={personalInfo.about.college.link}>
              {personalInfo.about.college.name}
            </ExtLink>
            , under the supervision of Prof.{" "}
            <ExtLink href="https://www.cs.toronto.edu/~rahulgk/">
              Rahul Krishnan
            </ExtLink>
            . {personalInfo.about.interest} <br />{" "}
          </p>
          {/* <p className="text-lg">
             {personalInfo.about.interest} <br />{" "}
          </p> */}
          {/* <a className="text-sm">✉️ {personalInfo.about.email}</a> */}
          {/* <p className="text-sm text-gray-400">.. Last updated: Nov 21, 2024</p> */}
        </div>
      </div>
    </section>
  );
};

export default About;
