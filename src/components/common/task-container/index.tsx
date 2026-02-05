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
import { TTaskGroup, TVerificationStatus } from '@/types';
import { defineTaskIcon, defineTaskPointsRange } from '@/utils';

const defineDescription = (
  status: TVerificationStatus,
  groups?: TTaskGroup[]
) => {
  if (status === 'completed') {
    return <VerifiedIndicator><CheckIcon />Verified</VerifiedIndicator>
  }
  if (groups) {
    return <PontsCount>{defineTaskPointsRange(groups)}</PontsCount>
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
  groups,
  selected,
  onSelect,
}) => {
  // const tiers = groups ? defineTiers(groups) : undefined
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
