"use client";

import React, { useContext, useEffect } from "react";
import { useMap } from "react-leaflet";
import intersection from "set.prototype.intersection";
import difference from "set.prototype.difference";
import union from "set.prototype.union";
import { useTheme } from "@mui/material";
import { GeoJSON, LeafletEvent } from "leaflet";
import { isFeatureGroup, PendingImprovements } from "@/lib/ts/types";
import { StaticDataContext } from "@/providers/StaticDataProvider";

const getAllProjectIds = ({
  default_project_id,
  budget_project_ids,
}: {
  default_project_id: number | null;
  budget_project_ids: number[];
}) => {
  const retSet = new Set<number>();
  budget_project_ids.forEach((b) => retSet.add(b));
  if (default_project_id) {
    retSet.add(default_project_id);
  }
  return retSet;
};

interface ArterialLayerProps {
  improvements?: number[];
  pendingImprovements: PendingImprovements;
  setPendingImprovements: React.Dispatch<
    React.SetStateAction<PendingImprovements>
  >;
}

const ArterialLayer: React.FC<ArterialLayerProps> = ({
  improvements,
  pendingImprovements,
  setPendingImprovements,
}) => {
  const { arterials } = useContext(StaticDataContext);
  const map = useMap();
  const theme = useTheme();

  useEffect(() => {
    const layer = new GeoJSON(arterials!, {
      style: (f) => {
        if (f) {
          const projectId = f.properties.default_project_id;
          if (projectId) {
            return {
              stroke: true,
              opacity: 0.15,
            };
          }
        }
        return {
          stroke: true,
          opacity: 0,
        };
      },
      attribution: "arterial", //using this as a handle
      onEachFeature: (f, l) => {
        l.on("update", (e: LeafletEvent) => {
          //eslint-disable-next-line
          //@ts-ignore
          const improvements = e.improvements as number[];
          const pendingImprovements =
            //eslint-disable-next-line
            //@ts-ignore
            e.pendingImprovements as PendingImprovements;

          const allProjectIds = getAllProjectIds(f.properties);
          const improvmentsSet = new Set(improvements);
          const removeSet = new Set(pendingImprovements.toRemove);
          const addSet = new Set(pendingImprovements.toAdd);
          if (allProjectIds.size && isFeatureGroup(l)) {
            // if it's not in any set, base styling
            if (
              !intersection(addSet, allProjectIds).size &&
              !intersection(improvmentsSet, allProjectIds).size
            ) {
              l.setStyle({
                stroke: true,
                color: theme.palette.addableRoadColor,
                opacity: 0.075,
              });
              // we can't use events like this everywhere b/c of performance
              // (and note that the className method doesn't work)
              l.off("mouseover");
              l.off("mouseout");
              l.on("mouseover", () => {
                (l as any)._path.style["stroke-opacity"] = 1;
              });

              l.on("mouseout", () => {
                (l as any)._path.style["stroke-opacity"] = 0.075;
              });
            } else if (intersection(removeSet, allProjectIds).size) {
              l.setStyle({
                stroke: true,
                color: theme.palette.projectRemoveColor,
                opacity: 1,
              });
              l.off("mouseover");
              l.off("mouseout");
            } else if (!!intersection(addSet, allProjectIds).size) {
              {
                l.setStyle({
                  stroke: true,
                  color: theme.palette.projectAddColor,
                  opacity: 1,
                });
              }
              l.off("mouseover");
              l.off("mouseout");
              // if it's an existing improvement, give it the improvement color
            } else if (!!intersection(improvmentsSet, allProjectIds).size) {
              l.setStyle({
                stroke: true,
                color: theme.palette.projectColor,
                opacity: 1,
              });
              l.off("mouseover");
              l.off("mouseout");
            }
          }
          l.removeEventListener("click");
          l.addEventListener("click", (e) => {
            const allProjectIds = getAllProjectIds(
              e.sourceTarget.feature.properties
            );

            if (!!allProjectIds.size) {
              // if user added already, remove from add list
              if (!!intersection(addSet, allProjectIds).size) {
                setPendingImprovements(({ toRemove }) => ({
                  toAdd: [...difference(addSet, allProjectIds)],
                  toRemove,
                }));

                // if user has marked for removal, remove from remove list
              } else if (!!intersection(removeSet, allProjectIds).size) {
                setPendingImprovements(({ toAdd }) => ({
                  toRemove: [...difference(removeSet, allProjectIds)],
                  toAdd,
                }));
              } //if it's in the improvements list, they're removing
              else if (!!intersection(improvmentsSet, allProjectIds).size) {
                setPendingImprovements(({ toAdd }) => ({
                  toRemove: [...union(removeSet, allProjectIds)],
                  toAdd,
                }));
              }
              // otherwise they're marking it to add
              else {
                setPendingImprovements(({ toRemove }) => ({
                  toAdd: [...union(addSet, allProjectIds)],
                  toRemove,
                }));
              }
            }
          });
        });
      }, //end each feature
    }); //end layer
    map.addLayer(layer);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //fire update event to sync state with callbacks
  useEffect(() => {
    map.eachLayer((l) =>
      l.fire("update", { improvements, pendingImprovements })
    );
  }, [improvements, map, pendingImprovements]);

  return null;
};

export default ArterialLayer;
