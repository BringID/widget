import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  Subtitle,
  Content,
  ImageWrapper,
  CheckboxStyled,
  Body,
  Footer,
  VerifiedIndicator,
  PontsCount,
  CheckIcon
} from './styled-components';
import { TVerificationStatus, TTaskGroup } from '@/types';
import { defineTaskIcon } from '@/utils';

const definePointsRange = (groups: TTaskGroup[]) => {
  const scores = groups.map(g => g.score).filter((s): s is number => s !== undefined)
  if (scores.length === 0) return null
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  if (min === max) return `${min} pts`
  return `${min}-${max} pts`
}

const defineDescription = (
  status: TVerificationStatus,
  groups?: TTaskGroup[]
) => {
  if (status === 'completed') {
    return <VerifiedIndicator><CheckIcon />Verified</VerifiedIndicator>
  }
  if (groups) {
    const pointsRange = definePointsRange(groups)
    if (pointsRange) return <PontsCount>{pointsRange}</PontsCount>
  }
}

const TaskContainer: FC<TProps> = ({
  status,
  children,
  title,
  icon,
  id,
  selectable,
  description,
  selected,
  onSelect,
  groups,
}) => {
  const descriptionContent = defineDescription(status, groups)
  const TaskIcon = defineTaskIcon(icon)
  return (
    <Container status={status}>
      <Body selectable={selectable}>
        {selectable && (
          <CheckboxStyled
            checked={Boolean(selected)}
            onClick={onSelect}
            id={id}
          />
        )}
        <ImageWrapper>
          {TaskIcon && <TaskIcon /> }
        </ImageWrapper>
        <Content>
          <Title>{title}</Title>
          <Subtitle>{descriptionContent}</Subtitle>
        </Content>
        {children}
      </Body>
      {status !== 'completed' && description && <Footer>
        {description}
      </Footer>}

    </Container>
  );
};

export default TaskContainer;
