import React from "react";

export interface ProcessCardProps {
  id: number;
  processIcon: string;
  boxShape?: string;
  processTitle: string;
  processDesc: string;
}

const ProcessCard: React.FC<ProcessCardProps> = ({
  processIcon,
  processTitle,
  boxShape,
  processDesc,
}) => {
  return (
    <div className="text-center group relative">
      <div className="inline-block m-auto relative z-10 before:absolute before:top-4 before:-left-[10px] before:w-[200px] before:h-[200px] before:border-[2px] before:border-dashed before:border-PrimaryColor-0 before:rounded-full before:animate-rotate">
        <img src={processIcon} draggable={false} alt={processTitle} />
        {boxShape && (
          <img
            src={boxShape}
            draggable={false}
            alt="arrow"
            className="absolute top-1/2 -translate-y-1/2 -right-[165px] 2xl:-right-[195px] hidden xl:block"
          />
        )}
      </div>
      <h5 className="font-AlbertSans font-semibold text-HeadingColor-0 text-2xl mt-9 mb-4">
        {processTitle}
      </h5>
      <p className="font-AlbertSans text-TextColor-0 sm:w-2/3 md:w-full 2xl:w-3/4 mx-auto">
        {processDesc}
      </p>
    </div>
  );
};

export default ProcessCard;
